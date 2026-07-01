export type UserRole = "admin" | "operator" | "reviewer";
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

export type OperationTypeSummary = {
  id: number;
  name: string;
};

export type ItemDto = BaseCatalogDto & {
  unit_id: number;
  unit: UnitSummary;
  description: string | null;
  resource_specification: ResourceSpecificationDto | null;
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

export type ResourceSpecificationInputPayload = {
  item_id: number;
  quantity: string;
};

export type ResourceSpecificationInputDto = ResourceSpecificationInputPayload & {
  id: number;
  item: ItemSummary;
};

export type ResourceSpecificationPayload = {
  name: string;
  operation_type_id: number;
  workstation_id: number;
  output_quantity: number;
  inputs: ResourceSpecificationInputPayload[];
};

export type ResourceSpecificationDto = {
  id: number;
  item_id: number;
  name: string;
  operation_type_id: number;
  workstation_id: number;
  output_quantity: number;
  operation_type: OperationTypeSummary;
  workstation: WorkstationSummary;
  inputs: ResourceSpecificationInputDto[];
};

export type ResourceSpecificationUpdatePayload = Partial<Omit<ResourceSpecificationPayload, "inputs">> & {
  inputs?: ResourceSpecificationInputPayload[];
};

export type CatalogResource = "units" | "items" | "workstations" | "operation-types";

export type CatalogDtoMap = {
  units: UnitDto;
  items: ItemDto;
  workstations: WorkstationDto;
  "operation-types": OperationTypeDto;
};

export type CatalogPayloadMap = {
  units: UnitPayload;
  items: ItemPayload;
  workstations: WorkstationPayload;
  "operation-types": OperationTypePayload;
};

export type CatalogUpdatePayloadMap = {
  units: UnitUpdatePayload;
  items: ItemUpdatePayload;
  workstations: WorkstationUpdatePayload;
  "operation-types": OperationTypeUpdatePayload;
};

export type OrderLinePayload = {
  item_id: number;
  quantity: string;
};

export type CreateOrderPayload = {
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
  resource_specification_id: number | null;
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

export type CycleConflictDetail = {
  message: string;
  item_id: number;
  item_name: string;
};
