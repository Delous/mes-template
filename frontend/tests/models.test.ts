import assert from 'node:assert/strict';
import test from 'node:test';
import { toOrderPayload } from '../app/features/orders/create/model';
import { fromItem, toItemPayload, canSave } from '../app/features/catalogs/items/model';
import { toTaskPayload } from '../app/features/tasks/detail/model';
import { toCreateUserPayload, toUpdateUserPayload } from '../app/features/admin/users/model';
import { getSafeNextPath, toLoginPayload } from '../app/features/login/model';
import { toOrderDetailView, toTaskView, toUserView } from '../app/lib/view-models';
import type { ItemDto, OrderDetailDto, TaskDto } from '../app/types/api';
const form = (entries: [string, string][]) => {
  const result = new FormData();
  for (const [key, value] of entries) result.append(key, value);
  return result;
};
const item: ItemDto = {
  id: 7,
  name: 'Деталь',
  unit_id: 1,
  unit: { id: 1, name: 'Штука', symbol: 'шт' },
  description: null,
  is_product: true,
  group_uuid: 'group',
  is_main: true,
  variants: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  deleted_at: null,
  routes: [
    {
      key: 'r1',
      name: 'Раскрой',
      output_quantity: '2.50',
      steps: [
        {
          operation_type_id: 3,
          workstation_id: 4,
          materials: [{ input_item_id: 8, source_route_key: null, quantity: '1.25' }],
        },
      ],
    },
  ],
};
const task: TaskDto = {
  id: 2,
  task_type: 'operation',
  status: 'waiting',
  description: null,
  planned_quantity: '2.50',
  actual_quantity: '0',
  defect_quantity: '0',
  order_id: 3,
  order_line_id: 4,
  item_id: 7,
  workstation_id: null,
  item: { id: 7, name: 'Деталь', unit_id: 1 },
  workstation: null,
  dependencies: [
    { id: 1, description: null, status: 'done', item: { id: 8, name: 'Материал', unit_id: 1 } },
    {
      id: 5,
      description: 'Проверка',
      status: 'in_progress',
      item: { id: 8, name: 'Материал', unit_id: 1 },
    },
  ],
  executor_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};
test('order form keeps line order and normalizes decimal quantities', () => {
  assert.deepEqual(
    toOrderPayload(
      form([
        ['number', ' ORD-1 '],
        ['quantity-10', '2,5'],
        ['quantity-11', '3'],
      ]),
      [
        { id: 10, item_id: '7', main_id: '7', quantity: '1' },
        { id: 11, item_id: '9', main_id: '7', quantity: '1' },
      ],
    ),
    {
      number: 'ORD-1',
      lines: [
        { item_id: 7, quantity: '2.50' },
        { item_id: 9, quantity: '3.00' },
      ],
    },
  );
});
test('item draft owns a deep copy of routes', () => {
  const draft = fromItem(item);
  draft.routes[0].steps[0].materials[0].quantity = '99';
  assert.equal(item.routes[0].steps[0].materials[0].quantity, '1.25');
  assert.equal(draft.description, '');
});
test('item payload preserves route links and normalizes quantities', () => {
  const draft = fromItem(item);
  draft.name = ' Деталь ';
  draft.routes[0].output_quantity = '2,5';
  draft.routes[0].steps[0].materials.push({
    input_item_id: null,
    source_route_key: 'r2',
    quantity: '3,5',
  });
  const payload = toItemPayload(draft);
  assert.equal(payload.name, 'Деталь');
  assert.equal(payload.description, null);
  assert.equal(payload.routes?.[0].output_quantity, '2.50');
  assert.deepEqual(payload.routes?.[0].steps[0].materials[1], {
    input_item_id: null,
    source_route_key: 'r2',
    quantity: '3.50',
  });
});
test('item validation preserves first-step material requirement', () => {
  const draft = fromItem(item);
  assert.equal(canSave(draft), true);
  draft.routes[0].steps[0].materials = [];
  assert.equal(canSave(draft), false);
});
test('task transitions preserve optional fields and rejection comments', () => {
  assert.deepEqual(toTaskPayload('in_progress', form([])), {
    status: 'in_progress',
    actual_quantity_delta: undefined,
    defect_quantity_delta: undefined,
    comment: undefined,
  });
  assert.deepEqual(
    toTaskPayload(
      'rejected',
      form([
        ['defect_quantity_delta', ' 2 '],
        ['comment', ' Причина '],
      ]),
    ),
    {
      status: 'rejected',
      actual_quantity_delta: undefined,
      defect_quantity_delta: '2',
      comment: 'Причина',
    },
  );
});
test('task view preserves all dependencies and selects only unfinished blockers', () => {
  const view = toTaskView(task);
  assert.equal(view.title, 'Деталь');
  assert.equal(view.plannedLabel, '2,5');
  assert.equal(view.workstationLabel, 'Не указан');
  assert.deepEqual(view.dependencies, task.dependencies);
  assert.deepEqual(
    view.pendingDependencies.map((x) => x.id),
    [5],
  );
});
test('order detail preserves rows and missing catalog references', () => {
  const order: OrderDetailDto = {
    id: 3,
    number: 'ORD',
    status: 'new',
    created_at: task.created_at,
    updated_at: task.updated_at,
    lines: [
      { id: 4, item_id: 7, quantity: '2.5' },
      { id: 6, item_id: 99, quantity: '1' },
    ],
    tasks: [task],
  };
  const view = toOrderDetailView(order, [item]);
  assert.deepEqual(
    view.lines.map((x) => x.itemName),
    ['Деталь', '#99'],
  );
  assert.equal(view.quantityLabel, '3,5');
  assert.equal(view.tasks.length, 1);
  assert.equal(order.lines.length, 2);
});
test('user forms preserve passwords and repeated workstation fields', () => {
  assert.deepEqual(
    toCreateUserPayload(
      form([
        ['full_name', ' Иван '],
        ['password', ' secret '],
        ['role', 'reviewer'],
      ]),
    ),
    { full_name: 'Иван', password: ' secret ', role: 'reviewer' },
  );
  assert.deepEqual(
    toUpdateUserPayload(
      form([
        ['role', 'operator'],
        ['password', ''],
        ['workstation_ids', '2'],
        ['workstation_ids', '5'],
      ]),
    ),
    { role: 'operator', password: undefined, workstation_ids: [2, 5] },
  );
  const view = toUserView({
    id: 1,
    username: 'ivan',
    full_name: 'Иван',
    role: 'operator',
    workstations: [],
  });
  assert.equal(view.workstationNames, 'Не назначены');
});
test('login conversion and redirect validation preserve existing behavior', () => {
  assert.deepEqual(
    toLoginPayload(
      form([
        ['username', ' ivan '],
        ['password', ' pass '],
      ]),
    ),
    { login: 'ivan', password: ' pass ' },
  );
  assert.equal(getSafeNextPath('/orders/1'), '/orders/1');
  assert.equal(getSafeNextPath('//example.com'), '/tasks');
  assert.equal(getSafeNextPath(null), '/tasks');
});
