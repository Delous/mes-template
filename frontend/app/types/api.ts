export type UserRole = 'admin' | 'operator' | 'reviewer';
export type EditableUserRole = Exclude<UserRole, 'admin'>;

export type ListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
};

export type LoginPayload = {
  login: string;
  password: string;
};

export type MeDto = {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  workstation_ids: number[];
};

export type WorkstationDto = {
  id: number;
  name: string;
};

export type AdminUserDto = {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  workstations: WorkstationDto[];
};

export type CreateUserPayload = {
  full_name: string;
  password: string;
  role: EditableUserRole;
};

export type UpdateUserPayload = {
  password?: string;
  role?: EditableUserRole;
  workstation_ids?: number[];
};

export type CatalogStatus = 'active' | 'inactive';

export type BaseCatalogDto = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type UnitDto = BaseCatalogDto & {
  symbol: string;
};

export type UnitPayload = {
  name: string;
  symbol: string;
};

export type UnitUpdatePayload = Partial<UnitPayload>;

export type ItemSummary = {
  id: number;
  name: string;
  unit_id: number;
  description: string | null;
};

export type UnitSummary = {
  id: number;
  name: string;
  symbol: string;
};

export type WorkstationSummary = {
  id: number;
  name: string;
};

export type OperationTypeSummary = {
  id: number;
  name: string;
};

export type RouteMaterial = {
  input_item_id: number | null;
  source_route_key: string | null;
  quantity: string;
};
export type ItemRoute = {
  key: string;
  name: string;
  output_quantity: string;
  steps: { operation_type_id: number; workstation_id: number; materials: RouteMaterial[] }[];
};

export type ItemDto = BaseCatalogDto & {
  routes: ItemRoute[];
  group_uuid: string;
  is_main: boolean;
  variants: ItemDto[];
  unit_id: number;
  unit: UnitSummary;
  description: string | null;
  labor_minutes: number | null;
  is_product: boolean;
};

export type ItemPayload = {
  routes?: ItemRoute[];
  name: string;
  unit_id: number;
  description?: string | null;
  labor_minutes?: number | null;
  is_product?: boolean;
};

export type ItemUpdatePayload = Partial<ItemPayload>;

export type OperationTypeDto = {
  id: number;
  name: string;
};

export type WorkstationPayload = {
  name: string;
};

export type WorkstationUpdatePayload = Partial<WorkstationPayload>;

export type OperationTypePayload = {
  name: string;
};

export type OperationTypeUpdatePayload = Partial<OperationTypePayload>;

export type CatalogResource = 'units' | 'items' | 'workstations' | 'operation-types';

export type CatalogDtoMap = {
  units: UnitDto;
  items: ItemDto;
  workstations: WorkstationDto;
  'operation-types': OperationTypeDto;
};

export type CatalogPayloadMap = {
  units: UnitPayload;
  items: ItemPayload;
  workstations: WorkstationPayload;
  'operation-types': OperationTypePayload;
};

export type CatalogUpdatePayloadMap = {
  units: UnitUpdatePayload;
  items: ItemUpdatePayload;
  workstations: WorkstationUpdatePayload;
  'operation-types': OperationTypeUpdatePayload;
};

export type OrderLinePayload = {
  item_id: number;
  quantity: string;
};

export type OrderPriority = 'medium' | 'high';

export type UpdateOrderPayload = {
  priority?: OrderPriority | null;
  deadline?: string | null;
};

export type CreateOrderPayload = UpdateOrderPayload & {
  number: string;
  lines: OrderLinePayload[];
};

export type OrderLineDto = {
  id: number;
  item_id: number;
  quantity: string;
};

export type OrderDto = {
  id: number;
  number: string;
  status: string;
  priority: OrderPriority | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  lines: OrderLineDto[];
};

export type OrderDetailDto = OrderDto & {
  tasks: TaskDto[];
};

export type TaskType = 'operation' | 'quality_review';
export type TaskStatus = 'waiting' | 'to_do' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type TaskUpdateStatus = TaskStatus | 'rejected';

export type TaskDto = {
  id: number;
  name: string;
  routes: TaskRouteDto[];
  task_type: TaskType;
  status: TaskStatus;
  description: string | null;
  planned_quantity: string;
  actual_quantity: string;
  defect_quantity: string;
  order_id: number;
  order: Pick<OrderDto, 'id' | 'number' | 'priority' | 'deadline'>;
  order_line_id: number;
  item_id: number;
  item: {
    id: number;
    name: string;
    unit_id: number;
  };
  dependencies: TaskDependencyDto[];
  executor_id: number | null;
  created_at: string;
  updated_at: string;
};

export type TaskDependencyDto = {
  id: number;
  description: string | null;
  status: TaskStatus;
  item: { id: number; name: string; unit_id: number };
};

export type TaskRouteDto = {
  key: string;
  name: string;
  planned_quantity: string;
  steps: {
    operation_type_id: number;
    workstation_id: number;
    operation: string;
    workstation: string;
    materials: {
      input_item_id: number | null;
      source_route_key: string | null;
      name: string;
      quantity: string;
      unit: string;
    }[];
  }[];
};

export type UpdateTaskPayload = {
  status: TaskUpdateStatus;
  actual_quantity_delta?: string;
  defect_quantity_delta?: string;
  comment?: string;
};

export type ApiErrorBody = {
  detail?: unknown;
  message?: unknown;
};

export type CycleConflictDetail = {
  message: string;
  item_id: number;
  item_name: string;
};
