import type {
  AdminUserDto,
  CatalogDtoMap,
  CatalogPayloadMap,
  CatalogResource,
  CatalogUpdatePayloadMap,
  CreateOrderPayload,
  CreateUserPayload,
  CycleConflictDetail,
  ItemDto,
  ItemSummary,
  ListResponse,
  LoginPayload,
  MeDto,
  OperationTypeDto,
  OrderDto,
  ResourceSpecificationPayload,
  ResourceSpecificationUpdatePayload,
  TaskDto,
  TaskStatus,
  UpdateTaskPayload,
  UpdateUserPayload,
  UnitDto,
  UnitSummary,
  WorkstationDto,
} from "@/types/api";

const now = "2026-06-15T10:00:00Z";
const storageKey = "mes-template:mock-user";

let units: UnitDto[] = [
  { id: 1, name: "Метр", symbol: "м", created_at: now, updated_at: now, deleted_at: null },
  { id: 2, name: "Штука", symbol: "шт", created_at: now, updated_at: now, deleted_at: null },
];

let workstations: WorkstationDto[] = [
  { id: 1, name: "Пост экструзии" },
  { id: 2, name: "Пост сборки" },
];

let operationTypes: OperationTypeDto[] = [
  { id: 1, name: "Экструзия" },
  { id: 2, name: "Сборка" },
];

let items: ItemDto[] = [
  {
    id: 10,
    name: "Медная жила",
    unit_id: 1,
    unit: toUnitSummary(units[0]),
    description: "Сырье для кабеля",
    created_at: now,
    updated_at: now,
    deleted_at: null,
    is_product: false,
    resource_specification: null,
  },
  {
    id: 100,
    name: "Кабель 3x2.5",
    unit_id: 1,
    unit: toUnitSummary(units[0]),
    description: "Готовое изделие",
    created_at: now,
    updated_at: now,
    deleted_at: null,
    is_product: true,
    resource_specification: null,
  },
];

items[1].resource_specification = buildResourceSpecification(1, items[1].id, {
  name: "Производство кабеля",
  operation_type_id: 1,
  workstation_id: 1,
  output_quantity: 1,
  inputs: [{ item_id: 10, quantity: "3" }],
});

let users: AdminUserDto[] = [
  { id: 1, username: "admin", full_name: "Администратор", role: "admin", workstations },
  { id: 2, username: "operator", full_name: "Оператор линии", role: "operator", workstations: [workstations[0]] },
  { id: 3, username: "reviewer", full_name: "Инспектор ОТК", role: "reviewer", workstations: [workstations[1]] },
];

let orders: OrderDto[] = [
  {
    id: 1,
    number: "ORD-001",
    status: "created",
    created_at: now,
    updated_at: now,
    lines: [{ id: 1, item_id: 100, quantity: "100.000000" }],
  },
];

let tasks: TaskDto[] = [
  {
    id: 1,
    task_type: "warehouse_delivery",
    status: "to_do",
    description: "Доставить материалы: Медная жила",
    planned_quantity: "300.000000",
    actual_quantity: "0.000000",
    defect_quantity: "0.000000",
    order_id: 1,
    order_line_id: 1,
    item_id: 10,
    resource_specification_id: 1,
    workstation_id: 1,
    source_workstation_id: null,
    target_workstation_id: 1,
    item: toTaskItem(items[0]),
    workstation: toTaskWorkstation(workstations[0]),
    source_workstation: null,
    target_workstation: toTaskWorkstation(workstations[0]),
    executor_id: null,
    created_at: now,
    updated_at: now,
  },
  {
    id: 2,
    task_type: "operation",
    status: "to_do",
    description: "Производство кабеля",
    planned_quantity: "100.000000",
    actual_quantity: "0.000000",
    defect_quantity: "0.000000",
    order_id: 1,
    order_line_id: 1,
    item_id: 100,
    resource_specification_id: 1,
    workstation_id: 1,
    source_workstation_id: null,
    target_workstation_id: null,
    item: toTaskItem(items[1]),
    workstation: toTaskWorkstation(workstations[0]),
    source_workstation: null,
    target_workstation: null,
    executor_id: null,
    created_at: now,
    updated_at: now,
  },
];

function clone<T>(value: T): T {
  return structuredClone(value);
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(value)), 160);
  });
}

function currentIso() {
  return new Date().toISOString();
}

function saveUser(user: MeDto | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(storageKey, JSON.stringify(user));
  else window.localStorage.removeItem(storageKey);
}

function readUser(): MeDto | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MeDto;
  } catch {
    return null;
  }
}

function toList<T>(itemsToList: T[], page: number, size: number): ListResponse<T> {
  return {
    items: clone(itemsToList).slice((page - 1) * size, page * size),
    total: itemsToList.length,
    page,
    size,
  };
}

function nextId(itemsWithIds: { id: number }[]) {
  return Math.max(0, ...itemsWithIds.map((item) => item.id)) + 1;
}

function toUnitSummary(unit: UnitDto): UnitSummary {
  return { id: unit.id, name: unit.name, symbol: unit.symbol };
}

function toItemSummary(item: ItemDto): ItemSummary {
  return { id: item.id, name: item.name, unit_id: item.unit_id, description: item.description };
}

function toTaskItem(item: ItemDto) {
  return { id: item.id, name: item.name, unit_id: item.unit_id };
}

function toTaskWorkstation(workstation: WorkstationDto) {
  return { id: workstation.id, name: workstation.name };
}

function decimal(value: string | number, digits = 6) {
  const numeric = Number(String(value).replace(",", "."));
  return Number.isFinite(numeric) ? numeric.toFixed(digits) : (0).toFixed(digits);
}

function isDeleted(item: { id: number; deleted_at?: string | null }) {
  return "deleted_at" in item && Boolean(item.deleted_at);
}

function activeFilter<T extends { id: number; deleted_at?: string | null }>(itemsToFilter: T[], includeDeleted: boolean) {
  return includeDeleted ? itemsToFilter : itemsToFilter.filter((item) => !isDeleted(item));
}

function findActiveItem(id: number) {
  const item = items.find((candidate) => candidate.id === id && !candidate.deleted_at);
  if (!item) throw new Error(`Номенклатура не найдена: ${id}`);
  return item;
}

function findWorkstation(id: number) {
  const workstation = workstations.find((candidate) => candidate.id === id);
  if (!workstation) throw new Error(`Рабочий пост не найден: ${id}`);
  return workstation;
}

function findOperationType(id: number) {
  const operationType = operationTypes.find((candidate) => candidate.id === id);
  if (!operationType) throw new Error(`Тип операции не найден: ${id}`);
  return operationType;
}

function buildResourceSpecification(id: number, itemId: number, payload: ResourceSpecificationPayload) {
  return {
    id,
    item_id: itemId,
    name: payload.name,
    operation_type_id: Number(payload.operation_type_id),
    workstation_id: Number(payload.workstation_id),
    output_quantity: Number(payload.output_quantity),
    operation_type: findOperationType(Number(payload.operation_type_id)),
    workstation: findWorkstation(Number(payload.workstation_id)),
    inputs: payload.inputs.map((input, index) => {
      const item = findActiveItem(Number(input.item_id));
      return {
        id: index + 1,
        item_id: item.id,
        item: toItemSummary(item),
        quantity: decimal(input.quantity),
      };
    }),
  };
}

function getCatalogStore<R extends CatalogResource>(resource: R): CatalogDtoMap[R][] {
  const stores = {
    units,
    items,
    workstations,
    "operation-types": operationTypes,
  } satisfies Record<CatalogResource, unknown[]>;
  return stores[resource] as CatalogDtoMap[R][];
}

function setCatalogStore<R extends CatalogResource>(resource: R, value: CatalogDtoMap[R][]) {
  if (resource === "units") units = value as UnitDto[];
  if (resource === "items") items = value as ItemDto[];
  if (resource === "workstations") workstations = value as WorkstationDto[];
  if (resource === "operation-types") operationTypes = value as OperationTypeDto[];
}

function rebuildItemRelations() {
  items = items.map((item) => ({
    ...item,
    unit: toUnitSummary(units.find((unit) => unit.id === item.unit_id) ?? units[0]),
  }));
}

function ensureUniqueCatalogName<R extends CatalogResource>(resource: R, name: string, excludeId?: number) {
  const duplicate = getCatalogStore(resource).some((item) => item.name === name && item.id !== excludeId);
  if (duplicate) throw new Error("Название справочника уже используется.");
}

function buildCatalogItem<R extends CatalogResource>(resource: R, payload: CatalogPayloadMap[R] & { id?: number }): CatalogDtoMap[R] {
  const timestamp = currentIso();
  const base = {
    id: payload.id ?? nextId(getCatalogStore(resource)),
    created_at: "created_at" in payload && typeof payload.created_at === "string" ? payload.created_at : timestamp,
    updated_at: timestamp,
    deleted_at: null,
  };

  if (resource === "units") {
    return { ...base, name: String(payload.name), symbol: String((payload as CatalogPayloadMap["units"]).symbol) } as CatalogDtoMap[R];
  }

  if (resource === "items") {
    const data = payload as CatalogPayloadMap["items"] & Partial<ItemDto>;
    const unit = units.find((candidate) => candidate.id === Number(data.unit_id) && !candidate.deleted_at);
    if (!unit) throw new Error("Единица измерения не найдена.");
    return {
      ...base,
      name: data.name,
      unit_id: Number(data.unit_id),
      unit: toUnitSummary(unit),
      description: data.description ?? null,
      is_product: Boolean(data.is_product),
      resource_specification: data.resource_specification ?? null,
    } as CatalogDtoMap[R];
  }

  if (resource === "workstations") {
    const data = payload as CatalogPayloadMap["workstations"];
    return { id: payload.id ?? nextId(workstations), name: data.name } as CatalogDtoMap[R];
  }

  const data = payload as CatalogPayloadMap["operation-types"];
  return { id: payload.id ?? nextId(operationTypes), name: data.name } as CatalogDtoMap[R];
}

function detectCycle(targetItemId: number, inputIds: number[]) {
  const graph = Object.fromEntries(
    items
      .filter((item) => item.id !== targetItemId && item.resource_specification)
      .map((item) => [item.id, item.resource_specification?.inputs.map((input) => input.item_id) ?? []]),
  );

  function reachesTarget(itemId: number, visited = new Set<number>()): boolean {
    if (itemId === targetItemId) return true;
    if (visited.has(itemId)) return false;
    visited.add(itemId);
    return (graph[itemId] ?? []).some((nextItemId) => reachesTarget(nextItemId, visited));
  }

  return inputIds.find((itemId) => reachesTarget(itemId)) ?? null;
}

function throwCycleConflict(itemId: number): never {
  const item = findActiveItem(itemId);
  const detail: CycleConflictDetail = {
    message: "Циклическая зависимость ресурсной спецификации",
    item_id: item.id,
    item_name: item.name,
  };
  const error = new Error(`${detail.message}: ${detail.item_name}`) as Error & {
    response: { data: { detail: CycleConflictDetail } };
  };
  error.response = { data: { detail } };
  throw error;
}

export async function login(payload: LoginPayload) {
  if (!payload.login || !payload.password) throw new Error("Введите логин и пароль.");
  const user = users.find((item) => item.username === payload.login) ?? users[1];
  const me: MeDto = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    workstation_ids: user.workstations.map((workstation) => workstation.id),
  };
  saveUser(me);
  return delay(me);
}

export async function logout() {
  saveUser(null);
  return delay(undefined);
}

export async function getMe() {
  return delay(readUser());
}

export async function getTasks(page = 1, size = 20) {
  return delay(toList([...tasks].sort((a, b) => a.id - b.id), page, size));
}

export async function getTask(id: number) {
  const task = tasks.find((item) => item.id === id);
  if (!task) throw new Error("Задача не найдена.");
  return delay(task);
}

export async function updateTask(id: number, payload: UpdateTaskPayload) {
  const task = tasks.find((item) => item.id === id);
  if (!task) throw new Error("Задача не найдена.");
  task.status = payload.status !== "rejected" ? (payload.status as TaskStatus) : "waiting";
  task.actual_quantity = addDecimal(task.actual_quantity, payload.actual_quantity_delta);
  task.defect_quantity = addDecimal(task.defect_quantity, payload.defect_quantity_delta);
  task.updated_at = currentIso();
  return delay(task);
}

export async function getOrders(page = 1, size = 20) {
  return delay(toList([...orders].sort((a, b) => b.id - a.id), page, size));
}

export async function getOrder(id: number) {
  const order = orders.find((item) => item.id === id);
  if (!order) throw new Error("Заказ не найден.");
  return delay(order);
}

export async function createOrder(payload: CreateOrderPayload) {
  if (!payload.lines.length) throw new Error("Добавьте хотя бы одну строку заказа.");
  const order: OrderDto = {
    id: nextId(orders),
    number: payload.number,
    status: "created",
    created_at: currentIso(),
    updated_at: currentIso(),
    lines: payload.lines.map((line, index) => {
      const item = findActiveItem(Number(line.item_id));
      if (!item.resource_specification) throw new Error(`Нет ресурсной спецификации: ${item.name}`);
      return { id: index + 1, item_id: item.id, quantity: decimal(line.quantity) };
    }),
  };
  orders = [order, ...orders];
  createTasksForOrder(order);
  return delay(order);
}

function createTasksForOrder(order: OrderDto) {
  for (const line of order.lines) {
    const item = findActiveItem(line.item_id);
    const specification = item.resource_specification;
    if (!specification) continue;
    const workstation = findWorkstation(specification.workstation_id);
    const quantity = Number(line.quantity);

    for (const input of specification.inputs) {
      const inputItem = findActiveItem(input.item_id);
      tasks.push({
        id: nextId(tasks),
        task_type: "warehouse_delivery",
        status: "to_do",
        description: `Доставить материалы: ${inputItem.name}`,
        planned_quantity: decimal(Number(input.quantity) * quantity),
        actual_quantity: "0.000000",
        defect_quantity: "0.000000",
        order_id: order.id,
        order_line_id: line.id,
        item_id: input.item_id,
        resource_specification_id: specification.id,
        workstation_id: specification.workstation_id,
        source_workstation_id: null,
        target_workstation_id: specification.workstation_id,
        item: toTaskItem(inputItem),
        workstation: toTaskWorkstation(workstation),
        source_workstation: null,
        target_workstation: toTaskWorkstation(workstation),
        executor_id: null,
        created_at: currentIso(),
        updated_at: currentIso(),
      });
    }

    tasks.push({
      id: nextId(tasks),
      task_type: "operation",
      status: "to_do",
      description: specification.name,
      planned_quantity: decimal(quantity),
      actual_quantity: "0.000000",
      defect_quantity: "0.000000",
      order_id: order.id,
      order_line_id: line.id,
      item_id: item.id,
      resource_specification_id: specification.id,
      workstation_id: specification.workstation_id,
      source_workstation_id: null,
      target_workstation_id: null,
      item: toTaskItem(item),
      workstation: toTaskWorkstation(workstation),
      source_workstation: null,
      target_workstation: null,
      executor_id: null,
      created_at: currentIso(),
      updated_at: currentIso(),
    });

    tasks.push({
      id: nextId(tasks),
      task_type: "warehouse_delivery",
      status: "to_do",
      description: `Доставить готовое на склад: ${item.name}`,
      planned_quantity: decimal(quantity),
      actual_quantity: "0.000000",
      defect_quantity: "0.000000",
      order_id: order.id,
      order_line_id: line.id,
      item_id: item.id,
      resource_specification_id: specification.id,
      workstation_id: specification.workstation_id,
      source_workstation_id: specification.workstation_id,
      target_workstation_id: null,
      item: toTaskItem(item),
      workstation: toTaskWorkstation(workstation),
      source_workstation: toTaskWorkstation(workstation),
      target_workstation: null,
      executor_id: null,
      created_at: currentIso(),
      updated_at: currentIso(),
    });
  }
}

export async function getCatalog<R extends CatalogResource>(resource: R, page = 1, size = 20, includeDeleted = false, onlyProducts = false) {
  const filteredItems = activeFilter(getCatalogStore(resource), includeDeleted);
  const productFilteredItems =
    resource === "items" && onlyProducts
      ? filteredItems.filter((item) => (item as ItemDto).is_product)
      : filteredItems;
  const orderedItems =
    resource === "items"
      ? [...productFilteredItems].sort((first, second) => first.name.localeCompare(second.name, "ru", { sensitivity: "base" }) || first.id - second.id)
      : productFilteredItems;
  return delay(toList(orderedItems, page, size));
}

export async function getCatalogItem<R extends CatalogResource>(resource: R, id: number) {
  const item = getCatalogStore(resource).find((candidate) => candidate.id === id && !isDeleted(candidate));
  if (!item) throw new Error("Запись справочника не найдена.");
  return delay(item);
}

export async function createCatalogItem<R extends CatalogResource>(resource: R, payload: CatalogPayloadMap[R]) {
  ensureUniqueCatalogName(resource, payload.name);
  const created = buildCatalogItem(resource, payload);
  setCatalogStore(resource, [created, ...getCatalogStore(resource)] as CatalogDtoMap[R][]);
  return delay(created);
}

export async function updateCatalogItem<R extends CatalogResource>(resource: R, id: number, payload: CatalogUpdatePayloadMap[R]) {
  const store = getCatalogStore(resource);
  const index = store.findIndex((item) => item.id === id && !isDeleted(item));
  if (index < 0) throw new Error("Запись справочника не найдена.");
  if (payload.name !== undefined) ensureUniqueCatalogName(resource, payload.name, id);
  const updated = buildCatalogItem(resource, { ...store[index], ...payload, id } as CatalogPayloadMap[R] & { id: number });
  store[index] = updated;
  setCatalogStore(resource, store);
  return delay(updated);
}

export async function deleteCatalogItem<R extends CatalogResource>(resource: R, id: number) {
  const store = getCatalogStore(resource);
  const item = store.find((candidate) => candidate.id === id && !isDeleted(candidate));
  if (!item) throw new Error("Запись справочника не найдена.");
  if (!("deleted_at" in item)) throw new Error("Удаление недоступно для этого справочника.");
  const deletable = item as { deleted_at: string | null; updated_at: string };
  deletable.deleted_at = currentIso();
  deletable.updated_at = currentIso();
  return delay(undefined);
}

export async function createResourceSpecification(itemId: number, payload: ResourceSpecificationPayload) {
  const item = findActiveItem(itemId);
  if (item.resource_specification) throw new Error("Ресурсная спецификация уже есть.");
  const conflictId = detectCycle(itemId, payload.inputs.map((input) => Number(input.item_id)));
  if (conflictId) throwCycleConflict(conflictId);
  item.resource_specification = buildResourceSpecification(Date.now(), itemId, payload);
  item.updated_at = currentIso();
  return delay(item);
}

export async function updateResourceSpecification(itemId: number, payload: ResourceSpecificationUpdatePayload) {
  const item = findActiveItem(itemId);
  if (!item.resource_specification) throw new Error("Ресурсная спецификация не найдена.");
  const nextPayload = { ...item.resource_specification, ...payload } as ResourceSpecificationPayload;
  const conflictId = detectCycle(itemId, nextPayload.inputs.map((input) => Number(input.item_id)));
  if (conflictId) throwCycleConflict(conflictId);
  item.resource_specification = buildResourceSpecification(item.resource_specification.id, itemId, nextPayload);
  item.updated_at = currentIso();
  return delay(item);
}

export async function getAdminUsers(page = 1, size = 20) {
  return delay(toList(users, page, size));
}

export async function createAdminUser(payload: CreateUserPayload) {
  const username = makeUsername(payload.full_name);
  const next: AdminUserDto = {
    id: nextId(users),
    username,
    full_name: payload.full_name,
    role: payload.role,
    workstations: [],
  };
  users = [next, ...users];
  return delay(next);
}

export async function updateAdminUser(id: number, payload: UpdateUserPayload) {
  const user = users.find((item) => item.id === id);
  if (!user) throw new Error("Пользователь не найден.");
  if (payload.role) user.role = payload.role;
  if (payload.workstation_ids !== undefined) {
    user.workstations = workstations.filter((workstation) => payload.workstation_ids?.includes(workstation.id));
  }
  return delay(user);
}

function makeUsername(fullName: string) {
  const base = fullName
    .trim()
    .toLowerCase()
    .replace(/ё/g, "e")
    .replace(/[^a-zа-я0-9]+/gi, "")
    .slice(0, 24);
  const username = base || `user${users.length + 1}`;
  if (!users.some((user) => user.username === username)) return username;
  return `${username}${users.length + 1}`;
}

function addDecimal(current: string, delta: string | undefined) {
  if (!delta) return current;
  const value = Number(current) + Number(delta.replace(",", "."));
  return Number.isFinite(value) ? value.toFixed(6) : current;
}

rebuildItemRelations();
