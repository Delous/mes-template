import { demoBoms, demoItems, demoRoutes } from "@/entities/catalog/mock";
import type { OrderDto } from "./types";

export const demoOrders: OrderDto[] = [
  {
    id: 1,
    number: "ORD-001",
    status: "created",
    created_at: "2026-06-15T10:00:00Z",
    updated_at: "2026-06-15T10:00:00Z",
    lines: [
      {
        id: 1,
        item_id: 100,
        item: demoItems[1],
        route_id: 5,
        route: demoRoutes[0],
        bom_id: 3,
        bom: demoBoms[0],
        quantity: "100.000000",
      },
    ],
  },
];
