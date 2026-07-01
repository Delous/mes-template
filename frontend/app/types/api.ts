export type UserRole = "admin" | "operator" | "reviewer" | "storekeeper";
export type EditableUserRole = Exclude<UserRole, "admin">;

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

export type CatalogStatus = "active" | "inactive";

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

export type ItemDto = BaseCatalogDto & {
  unit_id: number;
  unit: UnitSummary;
  description: string | null;
};

export type ItemPayload = {
  name: string;
  unit_id: number;
  description?: string | null;
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

export type BomLinePayload = {
  component_item_id: number;
  quantity: string;
  scrap_percent: string;
};

export type BomLineDto = BomLinePayload & {
  id: number;
  component_item: ItemSummary;
};

export type BomDto = BaseCatalogDto & {
  item_id: number;
  item: ItemSummary;
  version: string;
  status: CatalogStatus | string;
  is_default: boolean;
  lines: BomLineDto[];
};

export type BomPayload = {
  item_id: number;
  name: string;
  version: string;
  status: CatalogStatus | string;
  is_default: boolean;
  lines: BomLinePayload[];
};

export type BomUpdatePayload = Partial<Omit<BomPayload, "lines">> & {
  lines?: BomLinePayload[];
};

export type RouteIoPayload = {
  item_id: number;
  quantity: string;
};

export type RouteIoDto = RouteIoPayload & {
  id: number;
  item: ItemSummary;
};

export type RouteOperationPayload = {
  operation_number: number;
  name: string;
  workstation_id: number;
  setup_time_minutes: number;
  run_time_minutes: number;
  requires_quality_review: boolean;
  inputs: RouteIoPayload[];
  outputs: RouteIoPayload[];
};

export type RouteOperationDto = RouteOperationPayload & {
  id: number;
  workstation: WorkstationSummary;
  inputs: RouteIoDto[];
  outputs: RouteIoDto[];
};

export type RouteDto = BaseCatalogDto & {
  item_id: number;
  item: ItemSummary;
  version: string;
  status: CatalogStatus | string;
  is_default: boolean;
  operations: RouteOperationDto[];
};

export type RoutePayload = {
  item_id: number;
  name: string;
  version: string;
  status: CatalogStatus | string;
  is_default: boolean;
  operations: RouteOperationPayload[];
};

export type RouteUpdatePayload = Partial<Omit<RoutePayload, "operations">> & {
  operations?: RouteOperationPayload[];
};

export type CatalogResource = "units" | "items" | "workstations" | "operation-types" | "boms" | "routes";

export type CatalogDtoMap = {
  units: UnitDto;
  items: ItemDto;
  workstations: WorkstationDto;
  "operation-types": OperationTypeDto;
  boms: BomDto;
  routes: RouteDto;
};

export type CatalogPayloadMap = {
  units: UnitPayload;
  items: ItemPayload;
  workstations: WorkstationPayload;
  "operation-types": OperationTypePayload;
  boms: BomPayload;
  routes: RoutePayload;
};

export type CatalogUpdatePayloadMap = {
  units: UnitUpdatePayload;
  items: ItemUpdatePayload;
  workstations: WorkstationUpdatePayload;
  "operation-types": OperationTypeUpdatePayload;
  boms: BomUpdatePayload;
  routes: RouteUpdatePayload;
};

export type OrderLinePayload = {
  item_id: number;
  route_id: number;
  bom_id?: number | null;
  quantity: string;
};

export type CreateOrderPayload = {
  number: string;
  lines: OrderLinePayload[];
};

export type OrderLineDto = {
  id: number;
  item_id: number;
  route_id: number | null;
  bom_id: number | null;
  quantity: string;
};

export type OrderDto = {
  id: number;
  number: string;
  status: string;
  created_at: string;
  updated_at: string;
  lines: OrderLineDto[];
};

export type TaskType = "warehouse_delivery" | "operation" | "quality_review" | "transfer";
export type TaskStatus = "waiting" | "to_do" | "in_progress" | "blocked" | "done" | "cancelled";
export type TaskUpdateStatus = TaskStatus | "rejected";

export type TaskWorkstationDto = {
  id: number;
  name: string;
};

export type TaskDto = {
  id: number;
  task_type: TaskType;
  status: TaskStatus;
  description: string | null;
  planned_quantity: string;
  actual_quantity: string;
  defect_quantity: string;
  order_id: number;
  order_line_id: number;
  item_id: number;
  route_operation_id: number | null;
  workstation_id: number | null;
  source_workstation_id: number | null;
  target_workstation_id: number | null;
  item: {
    id: number;
    name: string;
    unit_id: number;
  };
  workstation: TaskWorkstationDto | null;
  source_workstation: TaskWorkstationDto | null;
  target_workstation: TaskWorkstationDto | null;
  executor_id: number | null;
  created_at: string;
  updated_at: string;
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
