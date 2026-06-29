import type {
  AdminUserDto,
  CreateTaskPayload,
  CreateUserPayload,
  ListResponse,
  LoginPayload,
  MeDto,
  TaskDto,
  UpdateTaskPayload,
  UpdateUserPayload,
  WorkCenterDto,
  WorkstationDto,
} from "@/types/api";

const now = "2026-06-15T10:00:00Z";
const storageKey = "mes-template:mock-user";

const workCenter: WorkCenterDto = {
  id: 1,
  name: "Линия экструзии 1",
  type: "production",
  description: "Основной производственный пост",
  created_at: now,
  updated_at: now,
  deleted_at: null,
};

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
];

let tasks: TaskDto[] = [
  {
    id: 1,
    task_type: "operation",
    status: "to_do",
    description: "Экструзия",
    planned_quantity: "100.000000",
    actual_quantity: "0.000000",
    defect_quantity: "0.000000",
    order_id: 1,
    order_line_id: 1,
    item_id: 100,
    route_operation_id: 12,
    work_center_id: 1,
    source_work_center_id: null,
    target_work_center_id: null,
    item: { id: 100, name: "Кабель 3x2.5", unit_id: 1 },
    work_center: workCenter,
    source_work_center: null,
    target_work_center: null,
    executor_id: null,
    created_at: now,
    updated_at: now,
  },
  {
    id: 2,
    task_type: "warehouse_delivery",
    status: "in_progress",
    description: "Доставка материала",
    planned_quantity: "300.000000",
    actual_quantity: "0.000000",
    defect_quantity: "0.000000",
    order_id: 1,
    order_line_id: 1,
    item_id: 10,
    route_operation_id: null,
    work_center_id: null,
    source_work_center_id: 2,
    target_work_center_id: 1,
    item: { id: 10, name: "Медная жила", unit_id: 1 },
    work_center: null,
    source_work_center: { ...workCenter, id: 2, name: "Склад сырья", type: "warehouse" },
    target_work_center: workCenter,
    executor_id: 2,
    created_at: now,
    updated_at: now,
  },
];

function clone<T>(value: T): T {
  return structuredClone(value);
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(value)), 180);
  });
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

function toList<T>(items: T[], page: number, size: number): ListResponse<T> {
  return {
    items: clone(items).slice((page - 1) * size, page * size),
    total: items.length,
    page,
    size,
  };
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
  return delay(toList(tasks, page, size));
}

export async function getTask(id: number) {
  const task = tasks.find((item) => item.id === id);
  if (!task) throw new Error("Задача не найдена.");
  return delay(task);
}

export async function createTask(payload: CreateTaskPayload) {
  const next: TaskDto = {
    id: Math.max(0, ...tasks.map((task) => task.id)) + 1,
    task_type: payload.task_type,
    status: "to_do",
    description: payload.description ?? null,
    planned_quantity: payload.planned_quantity,
    actual_quantity: "0.000000",
    defect_quantity: "0.000000",
    order_id: payload.order_id ?? 1,
    order_line_id: payload.order_line_id ?? 1,
    item_id: payload.item_id ?? 100,
    route_operation_id: payload.route_operation_id ?? null,
    work_center_id: payload.work_center_id ?? 1,
    source_work_center_id: payload.source_work_center_id ?? null,
    target_work_center_id: payload.target_work_center_id ?? null,
    item: { id: payload.item_id ?? 100, name: "Кабель 3x2.5", unit_id: 1 },
    work_center: workCenter,
    source_work_center: null,
    target_work_center: null,
    executor_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  tasks = [next, ...tasks];
  return delay(next);
}

export async function updateTask(id: number, payload: UpdateTaskPayload) {
  const task = tasks.find((item) => item.id === id);
  if (!task) throw new Error("Задача не найдена.");

  task.status = payload.status;
  task.actual_quantity = addDecimal(task.actual_quantity, payload.actual_quantity_delta);
  task.defect_quantity = addDecimal(task.defect_quantity, payload.defect_quantity_delta);
  task.updated_at = new Date().toISOString();

  return delay(task);
}

export async function getAdminUsers(page = 1, size = 50) {
  return delay(toList(users, page, size));
}

export async function createAdminUser(payload: CreateUserPayload) {
  const selectedWorkstations = workstations.filter((workstation) => payload.workstation_ids?.includes(workstation.id));
  const next: AdminUserDto = {
    id: Math.max(0, ...users.map((user) => user.id)) + 1,
    username: payload.username,
    full_name: payload.full_name,
    role: payload.role,
    workstations: selectedWorkstations,
  };

  users = [next, ...users];
  return delay(next);
}

export async function updateAdminUser(id: number, payload: UpdateUserPayload) {
  const user = users.find((item) => item.id === id);
  if (!user) throw new Error("Пользователь не найден.");

  if (payload.role) user.role = payload.role;
  if (payload.workstation_ids) {
    user.workstations = workstations.filter((workstation) => payload.workstation_ids?.includes(workstation.id));
  }

  return delay(user);
}

export async function getAdminWorkstations() {
  return delay(workstations);
}

export async function createAdminWorkstation(payload: { name: string }) {
  const next: WorkstationDto = {
    id: Math.max(0, ...workstations.map((workstation) => workstation.id)) + 1,
    name: payload.name,
  };

  workstations = [next, ...workstations];
  return delay(next);
}

export async function updateAdminWorkstation(id: number, payload: { name: string }) {
  const workstation = workstations.find((item) => item.id === id);
  if (!workstation) throw new Error("Рабочий пост не найден.");
  workstation.name = payload.name;
  return delay(workstation);
}

function addDecimal(current: string, delta: string | undefined) {
  if (!delta) return current;
  const value = Number(current) + Number(delta.replace(",", "."));
  return Number.isFinite(value) ? value.toFixed(6) : current;
}
