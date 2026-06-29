import type {
  AdminUserDto,
  BomDto,
  BomLinePayload,
  CatalogDtoMap,
  CatalogPayloadMap,
  CatalogResource,
  CatalogUpdatePayloadMap,
  CreateOrderPayload,
  CreateUserPayload,
  CreateWorkstationPayload,
  ItemDto,
  ItemSummary,
  ListResponse,
  LoginPayload,
  MeDto,
  OrderDto,
  RouteDto,
  RouteIoPayload,
  RouteOperationPayload,
  TaskDto,
  TaskStatus,
  UpdateTaskPayload,
  UpdateUserPayload,
  UnitDto,
  UnitSummary,
  WorkCenterDto,
  WorkCenterSummary,
  WorkstationDto,
} from "@/types/api";

const now = "2026-06-15T10:00:00Z";
const storageKey = "mes-template:mock-user";

let units: UnitDto[] = [
  { id: 1, name: "Метр", symbol: "м", created_at: now, updated_at: now, deleted_at: null },
  { id: 2, name: "Штука", symbol: "шт", created_at: now, updated_at: now, deleted_at: null },
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
  },
];

let workCenters: WorkCenterDto[] = [
  {
    id: 1,
    name: "Линия экструзии 1",
    type: "production",
    description: "Основной производственный пост",
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: 2,
    name: "Склад сырья",
    type: "warehouse",
    description: "Зона хранения сырья",
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: 3,
    name: "ОТК",
    type: "quality",
    description: "Контроль качества",
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
];

let boms: BomDto[] = [
  {
    id: 1,
    item_id: 100,
    item: toItemSummary(items[1]),
    name: "BOM Кабель 3x2.5",
    version: "1.0",
    status: "active",
    is_default: true,
    lines: [
      {
        id: 1,
        component_item_id: 10,
        component_item: toItemSummary(items[0]),
        quantity: "3.000000",
        scrap_percent: "1.50",
      },
    ],
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
];

let routes: RouteDto[] = [
  {
    id: 1,
    item_id: 100,
    item: toItemSummary(items[1]),
    name: "Маршрут Кабель 3x2.5",
    version: "1.0",
    status: "active",
    is_default: true,
    operations: [
      {
        id: 1,
        operation_number: 10,
        name: "Экструзия",
        work_center_id: 1,
        work_center: toWorkCenterSummary(workCenters[0]),
        setup_time_minutes: 15,
        run_time_minutes: 60,
        requires_quality_review: true,
        inputs: [{ id: 1, item_id: 10, item: toItemSummary(items[0]), quantity: "3.000000" }],
        outputs: [{ id: 1, item_id: 100, item: toItemSummary(items[1]), quantity: "1.000000" }],
      },
      {
        id: 2,
        operation_number: 20,
        name: "Маркировка",
        work_center_id: 1,
        work_center: toWorkCenterSummary(workCenters[0]),
        setup_time_minutes: 5,
        run_time_minutes: 20,
        requires_quality_review: false,
        inputs: [{ id: 2, item_id: 100, item: toItemSummary(items[1]), quantity: "1.000000" }],
        outputs: [{ id: 2, item_id: 100, item: toItemSummary(items[1]), quantity: "1.000000" }],
      },
    ],
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
];

let workstations: WorkstationDto[] = [
  { id: 1, name: "Пост экструзии" },
  { id: 2, name: "Склад сырья" },
  { id: 3, name: "ОТК" },
];

let users: AdminUserDto[] = [
  {
    id: 1,
    username: "admin",
    full_name: "Администратор",
    role: "admin",
    workstations,
  },
  {
    id: 2,
    username: "operator",
    full_name: "Оператор линии",
    role: "operator",
    workstations: [workstations[0]],
  },
  {
    id: 3,
    username: "reviewer",
    full_name: "Инспектор ОТК",
    role: "reviewer",
    workstations: [workstations[2]],
  },
  {
    id: 4,
    username: "storekeeper",
    full_name: "Кладовщик",
    role: "storekeeper",
    workstations: [workstations[1]],
  },
];

let orders: OrderDto[] = [
  {
    id: 1,
    number: "ORD-001",
    status: "created",
    created_at: now,
    updated_at: now,
    lines: [{ id: 1, item_id: 100, route_id: 1, bom_id: 1, quantity: "100.000000" }],
  },
];

let tasks: TaskDto[] = [
  {
    id: 1,
    task_type: "warehouse_delivery",
    status: "to_do",
    description: "Доставить материалы: 10",
    planned_quantity: "300.000000",
    actual_quantity: "0.000000",
    defect_quantity: "0.000000",
    order_id: 1,
    order_line_id: 1,
    item_id: 10,
    route_operation_id: 1,
    work_center_id: 1,
    source_work_center_id: null,
    target_work_center_id: 1,
    item: toTaskItem(items[0]),
    work_center: toTaskWorkCenter(workCenters[0]),
    source_work_center: null,
    target_work_center: toTaskWorkCenter(workCenters[0]),
    executor_id: null,
    created_at: now,
    updated_at: now,
  },
  {
    id: 2,
    task_type: "operation",
    status: "to_do",
    description: "Экструзия",
    planned_quantity: "100.000000",
    actual_quantity: "0.000000",
    defect_quantity: "0.000000",
    order_id: 1,
    order_line_id: 1,
    item_id: 100,
    route_operation_id: 1,
    work_center_id: 1,
    source_work_center_id: null,
    target_work_center_id: null,
    item: toTaskItem(items[1]),
    work_center: toTaskWorkCenter(workCenters[0]),
    source_work_center: null,
    target_work_center: null,
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
  if (user) {
    window.localStorage.setItem(storageKey, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(storageKey);
  }
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

function toWorkCenterSummary(workCenter: WorkCenterDto): WorkCenterSummary {
  return { id: workCenter.id, name: workCenter.name, type: workCenter.type, description: workCenter.description };
}

function toTaskWorkCenter(workCenter: WorkCenterDto) {
  return { id: workCenter.id, name: workCenter.name, type: workCenter.type };
}

function toTaskItem(item: ItemDto) {
  return { id: item.id, name: item.name, unit_id: item.unit_id };
}

function findActiveItem(id: number) {
  const item = items.find((candidate) => candidate.id === id && !candidate.deleted_at);
  if (!item) throw new Error(`Номенклатура не найдена: ${id}`);
  return item;
}

function findActiveRoute(id: number) {
  const route = routes.find((candidate) => candidate.id === id && !candidate.deleted_at);
  if (!route) throw new Error(`Маршрут не найден: ${id}`);
  if (route.status !== "active") throw new Error(`Маршрут не активен: ${id}`);
  return route;
}

function findActiveWorkCenter(id: number) {
  const workCenter = workCenters.find((candidate) => candidate.id === id && !candidate.deleted_at);
  if (!workCenter) throw new Error(`Рабочий центр не найден: ${id}`);
  return workCenter;
}

function rebuildItemRelations() {
  items = items.map((item) => ({
    ...item,
    unit: toUnitSummary(units.find((unit) => unit.id === item.unit_id) ?? units[0]),
  }));
}

function buildBomLines(lines: BomLinePayload[]) {
  return lines.map((line, index) => {
    const componentItem = findActiveItem(Number(line.component_item_id));
    return {
      id: index + 1,
      component_item_id: Number(line.component_item_id),
      component_item: toItemSummary(componentItem),
      quantity: decimal(line.quantity),
      scrap_percent: decimal(line.scrap_percent, 2),
    };
  });
}

function buildRouteIo(itemsPayload: RouteIoPayload[]) {
  return itemsPayload.map((item, index) => {
    const entity = findActiveItem(Number(item.item_id));
    return {
      id: index + 1,
      item_id: Number(item.item_id),
      item: toItemSummary(entity),
      quantity: decimal(item.quantity),
    };
  });
}

function buildRouteOperations(operations: RouteOperationPayload[]) {
  return operations.map((operation, index) => {
    const workCenter = findActiveWorkCenter(Number(operation.work_center_id));
    return {
      id: index + 1,
      operation_number: Number(operation.operation_number),
      name: operation.name,
      work_center_id: Number(operation.work_center_id),
      work_center: toWorkCenterSummary(workCenter),
      setup_time_minutes: Number(operation.setup_time_minutes) || 0,
      run_time_minutes: Number(operation.run_time_minutes) || 0,
      requires_quality_review: operation.requires_quality_review,
      inputs: buildRouteIo(operation.inputs),
      outputs: buildRouteIo(operation.outputs),
    };
  });
}

function decimal(value: string | number, digits = 6) {
  const numeric = Number(String(value).replace(",", "."));
  return Number.isFinite(numeric) ? numeric.toFixed(digits) : (0).toFixed(digits);
}

function activeFilter<T extends { deleted_at: string | null }>(itemsToFilter: T[], includeDeleted: boolean) {
  return includeDeleted ? itemsToFilter : itemsToFilter.filter((item) => !item.deleted_at);
}

function getCatalogStore<R extends CatalogResource>(resource: R): CatalogDtoMap[R][] {
  const stores = {
    units,
    items,
    "work-centers": workCenters,
    boms,
    routes,
  } satisfies Record<CatalogResource, unknown[]>;
  return stores[resource] as CatalogDtoMap[R][];
}

function setCatalogStore<R extends CatalogResource>(resource: R, value: CatalogDtoMap[R][]) {
  if (resource === "units") units = value as UnitDto[];
  if (resource === "items") items = value as ItemDto[];
  if (resource === "work-centers") workCenters = value as WorkCenterDto[];
  if (resource === "boms") boms = value as BomDto[];
  if (resource === "routes") routes = value as RouteDto[];
}

export async function login(payload: LoginPayload) {
  if (!payload.login || !payload.password) {
    throw new Error("Введите логин и пароль.");
  }

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

  if (payload.status !== "rejected") {
    task.status = payload.status as TaskStatus;
  } else {
    task.status = "waiting";
  }

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
      findActiveItem(Number(line.item_id));
      findActiveRoute(Number(line.route_id));
      return {
        id: index + 1,
        item_id: Number(line.item_id),
        route_id: Number(line.route_id),
        bom_id: line.bom_id ? Number(line.bom_id) : null,
        quantity: decimal(line.quantity),
      };
    }),
  };

  orders = [order, ...orders];
  createTasksForOrder(order);
  return delay(order);
}

function createTasksForOrder(order: OrderDto) {
  for (const line of order.lines) {
    const route = findActiveRoute(line.route_id ?? 0);
    const quantity = Number(line.quantity);

    for (const operation of route.operations) {
      const outputItem = operation.outputs[0]?.item ?? route.item;
      const workCenter = findActiveWorkCenter(operation.work_center_id);

      for (const input of operation.inputs) {
        const inputItem = findActiveItem(input.item_id);
        tasks.push({
          id: nextId(tasks),
          task_type: "warehouse_delivery",
          status: "to_do",
          description: `Доставить материалы: ${operation.operation_number}`,
          planned_quantity: decimal(Number(input.quantity) * quantity),
          actual_quantity: "0.000000",
          defect_quantity: "0.000000",
          order_id: order.id,
          order_line_id: line.id,
          item_id: input.item_id,
          route_operation_id: operation.id,
          work_center_id: operation.work_center_id,
          source_work_center_id: null,
          target_work_center_id: operation.work_center_id,
          item: toTaskItem(inputItem),
          work_center: toTaskWorkCenter(workCenter),
          source_work_center: null,
          target_work_center: toTaskWorkCenter(workCenter),
          executor_id: null,
          created_at: currentIso(),
          updated_at: currentIso(),
        });
      }

      tasks.push({
        id: nextId(tasks),
        task_type: "operation",
        status: "to_do",
        description: operation.name,
        planned_quantity: decimal((Number(operation.outputs[0]?.quantity ?? 1) || 1) * quantity),
        actual_quantity: "0.000000",
        defect_quantity: "0.000000",
        order_id: order.id,
        order_line_id: line.id,
        item_id: outputItem.id,
        route_operation_id: operation.id,
        work_center_id: operation.work_center_id,
        source_work_center_id: null,
        target_work_center_id: null,
        item: { id: outputItem.id, name: outputItem.name, unit_id: outputItem.unit_id },
        work_center: toTaskWorkCenter(workCenter),
        source_work_center: null,
        target_work_center: null,
        executor_id: null,
        created_at: currentIso(),
        updated_at: currentIso(),
      });

      if (operation.requires_quality_review) {
        tasks.push({
          id: nextId(tasks),
          task_type: "quality_review",
          status: "waiting",
          description: `Контроль качества: ${operation.operation_number}`,
          planned_quantity: decimal(quantity),
          actual_quantity: "0.000000",
          defect_quantity: "0.000000",
          order_id: order.id,
          order_line_id: line.id,
          item_id: outputItem.id,
          route_operation_id: operation.id,
          work_center_id: operation.work_center_id,
          source_work_center_id: null,
          target_work_center_id: null,
          item: { id: outputItem.id, name: outputItem.name, unit_id: outputItem.unit_id },
          work_center: toTaskWorkCenter(workCenter),
          source_work_center: null,
          target_work_center: null,
          executor_id: null,
          created_at: currentIso(),
          updated_at: currentIso(),
        });
      }
    }
  }
}

export async function getCatalog<R extends CatalogResource>(
  resource: R,
  page = 1,
  size = 20,
  includeDeleted = false,
) {
  return delay(toList(activeFilter(getCatalogStore(resource), includeDeleted), page, size));
}

export async function getCatalogItem<R extends CatalogResource>(resource: R, id: number) {
  const item = getCatalogStore(resource).find((candidate) => candidate.id === id && !candidate.deleted_at);
  if (!item) throw new Error("Запись справочника не найдена.");
  return delay(item);
}

export async function createCatalogItem<R extends CatalogResource>(resource: R, payload: CatalogPayloadMap[R]) {
  const created = buildCatalogItem(resource, payload);
  setCatalogStore(resource, [created, ...getCatalogStore(resource)] as CatalogDtoMap[R][]);
  return delay(created);
}

export async function updateCatalogItem<R extends CatalogResource>(
  resource: R,
  id: number,
  payload: CatalogUpdatePayloadMap[R],
) {
  const store = getCatalogStore(resource);
  const index = store.findIndex((item) => item.id === id && !item.deleted_at);
  if (index < 0) throw new Error("Запись справочника не найдена.");

  const updated = buildCatalogItem(resource, { ...store[index], ...payload, id } as CatalogPayloadMap[R] & { id: number });
  store[index] = updated;
  setCatalogStore(resource, store);
  return delay(updated);
}

export async function deleteCatalogItem<R extends CatalogResource>(resource: R, id: number) {
  const store = getCatalogStore(resource);
  const item = store.find((candidate) => candidate.id === id && !candidate.deleted_at);
  if (!item) throw new Error("Запись справочника не найдена.");
  item.deleted_at = currentIso();
  item.updated_at = currentIso();
  return delay(undefined);
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
    const data = payload as CatalogPayloadMap["items"];
    const unit = units.find((candidate) => candidate.id === Number(data.unit_id) && !candidate.deleted_at);
    if (!unit) throw new Error("Единица измерения не найдена.");
    return {
      ...base,
      name: data.name,
      unit_id: Number(data.unit_id),
      unit: toUnitSummary(unit),
      description: data.description ?? null,
    } as CatalogDtoMap[R];
  }

  if (resource === "work-centers") {
    const data = payload as CatalogPayloadMap["work-centers"];
    return { ...base, name: data.name, type: data.type, description: data.description ?? null } as CatalogDtoMap[R];
  }

  if (resource === "boms") {
    const data = payload as CatalogPayloadMap["boms"];
    const item = findActiveItem(Number(data.item_id));
    return {
      ...base,
      item_id: Number(data.item_id),
      item: toItemSummary(item),
      name: data.name,
      version: data.version,
      status: data.status,
      is_default: data.is_default,
      lines: buildBomLines(data.lines ?? []),
    } as CatalogDtoMap[R];
  }

  const data = payload as CatalogPayloadMap["routes"];
  const item = findActiveItem(Number(data.item_id));
  return {
    ...base,
    item_id: Number(data.item_id),
    item: toItemSummary(item),
    name: data.name,
    version: data.version,
    status: data.status,
    is_default: data.is_default,
    operations: buildRouteOperations(data.operations ?? []),
  } as CatalogDtoMap[R];
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

export async function getAdminWorkstations() {
  return delay(workstations);
}

export async function createAdminWorkstation(payload: CreateWorkstationPayload) {
  const next: WorkstationDto = {
    id: nextId(workstations),
    name: payload.name,
  };

  workstations = [next, ...workstations];
  return delay(next);
}

export async function deleteAdminWorkstation(id: number) {
  if (tasks.some((task) => task.work_center_id === id)) {
    throw new Error("Cannot delete workstation with tasks");
  }
  workstations = workstations.filter((workstation) => workstation.id !== id);
  users = users.map((user) => ({
    ...user,
    workstations: user.workstations.filter((workstation) => workstation.id !== id),
  }));
  return delay(undefined);
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
