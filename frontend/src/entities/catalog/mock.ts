import type { BomDto, ItemDto, RouteDto, UnitDto, WorkCenterDto } from "./types";

const now = "2026-06-15T10:00:00Z";

export const demoUnits: UnitDto[] = [
  { id: 1, name: "Метр", symbol: "м", created_at: now, updated_at: now, deleted_at: null },
  { id: 2, name: "Штука", symbol: "шт", created_at: now, updated_at: now, deleted_at: null },
];

export const demoItems: ItemDto[] = [
  {
    id: 10,
    name: "Медная жила",
    unit_id: 1,
    unit: demoUnits[0],
    description: "Сырье для кабеля",
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: 100,
    name: "Кабель 3x2.5",
    unit_id: 1,
    unit: demoUnits[0],
    description: "Готовое изделие",
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
];

export const demoWorkCenters: WorkCenterDto[] = [
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
];

export const demoBoms: BomDto[] = [
  {
    id: 3,
    item_id: 100,
    item: demoItems[1],
    name: "BOM Кабель 3x2.5",
    version: "1.0",
    status: "active",
    is_default: true,
    lines: [{ component_item_id: 10, component_item: demoItems[0], quantity: "3.000000", scrap_percent: "1.50" }],
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
];

export const demoRoutes: RouteDto[] = [
  {
    id: 5,
    item_id: 100,
    item: demoItems[1],
    name: "Маршрут Кабель 3x2.5",
    version: "1.0",
    status: "active",
    is_default: true,
    operations: [
      {
        operation_number: 10,
        name: "Экструзия",
        work_center_id: 1,
        work_center: demoWorkCenters[0],
        setup_time_minutes: 15,
        run_time_minutes: 60,
        requires_quality_review: true,
        inputs: [{ item_id: 10, item: demoItems[0], quantity: "3.000000" }],
        outputs: [{ item_id: 100, item: demoItems[1], quantity: "1.000000" }],
      },
    ],
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
];
