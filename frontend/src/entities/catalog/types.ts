export type CatalogStatus = "active" | "inactive";
export type WorkCenterType = "production" | "warehouse" | "quality" | string;

export type BaseCatalogDto = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type UnitDto = BaseCatalogDto & {
  symbol: string;
};

export type ItemDto = BaseCatalogDto & {
  unit_id: number;
  unit?: UnitDto;
  description: string | null;
};

export type WorkCenterDto = BaseCatalogDto & {
  type: WorkCenterType;
  description: string | null;
};

export type BomLineDto = {
  id?: number;
  component_item_id: number;
  component_item?: ItemDto;
  quantity: string;
  scrap_percent: string;
};

export type BomDto = BaseCatalogDto & {
  item_id: number;
  item?: ItemDto;
  version: string;
  status: CatalogStatus;
  is_default: boolean;
  lines?: BomLineDto[];
};

export type RouteOperationIoDto = {
  id?: number;
  item_id: number;
  item?: ItemDto;
  quantity: string;
};

export type RouteOperationDto = {
  id?: number;
  operation_number: number;
  name: string;
  work_center_id: number;
  work_center?: WorkCenterDto;
  setup_time_minutes: number;
  run_time_minutes: number;
  requires_quality_review: boolean;
  inputs: RouteOperationIoDto[];
  outputs: RouteOperationIoDto[];
};

export type RouteDto = BaseCatalogDto & {
  item_id: number;
  item?: ItemDto;
  version: string;
  status: CatalogStatus;
  is_default: boolean;
  operations?: RouteOperationDto[];
};

export type CatalogResource = "units" | "items" | "work-centers" | "boms" | "routes";

export type CatalogEntityMap = {
  units: UnitDto;
  items: ItemDto;
  "work-centers": WorkCenterDto;
  boms: BomDto;
  routes: RouteDto;
};
