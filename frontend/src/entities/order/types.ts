import type { BomDto, ItemDto, RouteDto } from "@/entities/catalog/types";

export type OrderStatus = "created" | "in_progress" | "done" | "cancelled" | string;

export type OrderLineDto = {
  id: number;
  item_id: number;
  route_id: number;
  bom_id?: number | null;
  quantity: string;
  item?: ItemDto;
  route?: RouteDto;
  bom?: BomDto | null;
};

export type OrderDto = {
  id: number;
  number: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  lines: OrderLineDto[];
};

export type CreateOrderPayload = {
  number: string;
  lines: {
    item_id: number;
    route_id: number;
    bom_id?: number | null;
    quantity: string;
  }[];
};
