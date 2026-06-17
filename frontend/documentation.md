Ниже инструкция для фронтенда на `Next.js + Radix UI Themes`, исходя из текущего состояния backend API.

---

# Инструкция для фронтенда

## 1. Общая модель системы

Система состоит из нескольких доменных областей:

```text
auth        - авторизация
admin       - пользователи и назначение рабочих центров
catalogs    - справочники
orders      - заказы
tasks       - задачи сотрудников
sensors     - значения датчиков, если нужны в UI
```

Главная бизнес-цепочка:

1. Пользователь заполняет справочники.
2. Пользователь создает маршрутные листы для `item`.
3. Пользователь создает заказ.
4. Backend автоматически создает граф задач:
   - доставка сырья кладовщиком;
   - выполнение операции оператором;
   - приемка ОТК, если включена;
   - перемещение между рабочими центрами кладовщиком.
5. Пользователи видят только задачи, доступные их роли.

---

# 2. Авторизация

Backend использует cookie-based auth.

Основной признак: фронт не должен сам вручную прокидывать access token в `Authorization`, если backend уже выставляет httpOnly cookie.

Для запросов из браузера нужно использовать:

```ts
fetch(url, {
  credentials: "include",
})
```

Для server components / server actions в Next.js нужно прокидывать cookies из текущего request context.

Пример:

```ts
import { cookies } from "next/headers";

export async function apiFetch(path: string, init?: RequestInit) {
  const cookieStore = await cookies();

  return fetch(`${process.env.API_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Cookie: cookieStore.toString(),
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}
```

Если запрос выполняется из client component:

```ts
await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tasks`, {
  credentials: "include",
});
```

---

# 3. Роли пользователей

Backend ожидает следующие роли:

```ts
type UserRole = "admin" | "operator" | "reviewer" | "storekeeper";
```

## Роли

| Role | Назначение |
|---|---|
| `admin` | Полный доступ |
| `operator` | Выполнение производственных операций |
| `reviewer` | Приемка ОТК |
| `storekeeper` | Складская логистика и перемещения |

## Важное для UI

Фронт не должен сам решать, какие задачи пользователю доступны. Backend уже фильтрует `GET /tasks`.

Но UI может использовать роль для навигации:

```ts
const navigationByRole = {
  admin: ["tasks", "orders", "catalogs", "users"],
  operator: ["tasks"],
  reviewer: ["tasks"],
  storekeeper: ["tasks"],
};
```

---

# 4. Тексты отображения

Все тексты для отображения должны лежать в одном файле.

Например:

```text
src/shared/i18n/labels.ts
```

## Пример файла

```ts
export const labels = {
  entities: {
    task: "Задача",
    tasks: "Задачи",

    order: "Заказ",
    orders: "Заказы",

    catalog: "Справочник",
    catalogs: "Справочники",

    unit: "Единица измерения",
    units: "Единицы измерения",

    item: "Номенклатура",
    items: "Номенклатура",

    workCenter: "Рабочий центр",
    workCenters: "Рабочие центры",

    route: "Маршрутный лист",
    routes: "Маршрутные листы",

    bom: "Спецификация",
    boms: "Спецификации",

    user: "Пользователь",
    users: "Пользователи",
  },

  taskTypes: {
    warehouse_delivery: "Доставка материала со склада",
    operation: "Производственная операция",
    quality_review: "Приемка ОТК",
    transfer: "Перемещение между постами",
  },

  taskStatuses: {
    waiting: "Ожидает предыдущий этап",
    to_do: "К выполнению",
    in_progress: "В работе",
    blocked: "Заблокирована",
    done: "Выполнена",
    cancelled: "Отменена",
  },

  roles: {
    admin: "Администратор",
    operator: "Оператор",
    reviewer: "ОТК",
    storekeeper: "Кладовщик",
  },

  fields: {
    id: "ID",
    name: "Название",
    symbol: "Обозначение",
    description: "Описание",
    status: "Статус",
    version: "Версия",
    quantity: "Количество",
    plannedQuantity: "Плановое количество",
    actualQuantity: "Фактическое количество",
    defectQuantity: "Брак",
    workCenter: "Рабочий центр",
    sourceWorkCenter: "Откуда",
    targetWorkCenter: "Куда",
    routeOperation: "Операция",
    createdAt: "Создано",
    updatedAt: "Обновлено",
  },

  actions: {
    create: "Создать",
    update: "Сохранить",
    delete: "Удалить",
    cancel: "Отмена",
    start: "Взять в работу",
    complete: "Завершить",
    block: "Заблокировать",
    reject: "Отклонить",
    approve: "Принять",
  },
} as const;
```

## Где использовать

Не писать в компонентах напрямую:

```tsx
// плохо
<Text>Задачи</Text>
```

Использовать словарь:

```tsx
<Text>{labels.entities.tasks}</Text>
```

## Server Components и кэширование

По возможности сопоставление backend-значений с отображаемыми текстами делать в server components или server-side utility.

Например:

```ts
import { labels } from "@/shared/i18n/labels";

export function mapTaskForView(task: TaskDto) {
  return {
    ...task,
    taskTypeLabel: labels.taskTypes[task.task_type],
    statusLabel: labels.taskStatuses[task.status],
  };
}
```

В server component:

```tsx
export default async function TasksPage() {
  const tasks = await getTasks();

  const viewTasks = tasks.items.map(mapTaskForView);

  return <TasksTable tasks={viewTasks} />;
}
```

Это дает:
- единый источник текстов;
- меньше логики в client components;
- проще кэшировать подготовленные данные;
- проще менять терминологию.

---

# 5. Навигация

## Главные разделы

Рекомендуемая структура навигации:

```text
Задачи
Заказы
Справочники
Пользователи
```

## Справочники

Справочники должны быть вынесены в отдельную категорию.

Справочниками считается все, что не связано напрямую с задачами и пользователями.

В текущем backend к справочникам относятся:

```text
Единицы измерения     /api/v1/catalogs/units
Номенклатура          /api/v1/catalogs/items
Рабочие центры        /api/v1/catalogs/work-centers
Спецификации BOM      /api/v1/catalogs/boms
Маршрутные листы      /api/v1/catalogs/routes
```

Рекомендуемая структура меню:

```ts
export const navigation = [
  {
    key: "tasks",
    label: labels.entities.tasks,
    href: "/tasks",
  },
  {
    key: "orders",
    label: labels.entities.orders,
    href: "/orders",
  },
  {
    key: "catalogs",
    label: labels.entities.catalogs,
    children: [
      { key: "units", label: labels.entities.units, href: "/catalogs/units" },
      { key: "items", label: labels.entities.items, href: "/catalogs/items" },
      { key: "workCenters", label: labels.entities.workCenters, href: "/catalogs/work-centers" },
      { key: "boms", label: labels.entities.boms, href: "/catalogs/boms" },
      { key: "routes", label: labels.entities.routes, href: "/catalogs/routes" },
    ],
  },
  {
    key: "users",
    label: labels.entities.users,
    href: "/admin/users",
  },
];
```

---

# 6. Mobile layout

Для мобильных приложений / мобильной версии сайта навигационная панель не должна быть сверху.

Требование:

- desktop: sidebar или верхняя навигация допустимы;
- mobile: навигация должна быть скрыта в burger menu слева.

## Рекомендация на Radix UI Themes

Использовать:

- `Dialog` или `Sheet`-паттерн на базе Radix Dialog;
- кнопка burger слева в header;
- меню открывается слева;
- затемнение overlay;
- пункты навигации вертикальным списком.

Пример структуры:

```tsx
<header>
  <IconButton onClick={() => setOpen(true)}>
    <MenuIcon />
  </IconButton>

  <Text>{currentPageLabel}</Text>
</header>

<MobileNavigationDrawer open={open} onOpenChange={setOpen} />
```

Для desktop:

```tsx
<Flex display={{ initial: "none", md: "flex" }}>
  <SidebarNavigation />
</Flex>
```

Для mobile:

```tsx
<Flex display={{ initial: "flex", md: "none" }}>
  <MobileHeader />
</Flex>
```

---

# 7. API: Catalogs

Все справочники находятся под:

```text
/api/v1/catalogs
```

## Общий CRUD

Для каждого справочника:

```http
GET    /api/v1/catalogs/{resource}
GET    /api/v1/catalogs/{resource}/{id}
POST   /api/v1/catalogs/{resource}
PATCH  /api/v1/catalogs/{resource}/{id}
DELETE /api/v1/catalogs/{resource}/{id}
```

Списки используют query-параметры:

```http
GET /api/v1/catalogs/items?page=1&size=20&include_deleted=false
```

Ответ списка:

```json
{
  "items": [],
  "total": 100,
  "page": 1,
  "size": 20
}
```

Удаление мягкое: `DELETE` проставляет `deleted_at`.

По умолчанию удаленные записи не возвращаются.

Чтобы показать удаленные:

```http
GET /api/v1/catalogs/items?include_deleted=true
```

---

## Units

```http
GET    /api/v1/catalogs/units
GET    /api/v1/catalogs/units/{id}
POST   /api/v1/catalogs/units
PATCH  /api/v1/catalogs/units/{id}
DELETE /api/v1/catalogs/units/{id}
```

Create:

```json
{
  "name": "Метр",
  "symbol": "м"
}
```

Response:

```json
{
  "id": 1,
  "name": "Метр",
  "symbol": "м",
  "created_at": "2026-06-15T10:00:00Z",
  "updated_at": "2026-06-15T10:00:00Z",
  "deleted_at": null
}
```

---

## Items

```http
GET    /api/v1/catalogs/items
GET    /api/v1/catalogs/items/{id}
POST   /api/v1/catalogs/items
PATCH  /api/v1/catalogs/items/{id}
DELETE /api/v1/catalogs/items/{id}
```

Create:

```json
{
  "name": "Медная жила",
  "unit_id": 1,
  "description": "Сырье для кабеля"
}
```

Response содержит и `unit_id`, и вложенный `unit`:

```json
{
  "id": 10,
  "name": "Медная жила",
  "unit_id": 1,
  "unit": {
    "id": 1,
    "name": "Метр",
    "symbol": "м"
  },
  "description": "Сырье для кабеля",
  "created_at": "2026-06-15T10:00:00Z",
  "updated_at": "2026-06-15T10:00:00Z",
  "deleted_at": null
}
```

---

## Work Centers

```http
GET    /api/v1/catalogs/work-centers
GET    /api/v1/catalogs/work-centers/{id}
POST   /api/v1/catalogs/work-centers
PATCH  /api/v1/catalogs/work-centers/{id}
DELETE /api/v1/catalogs/work-centers/{id}
```

Create:

```json
{
  "name": "Линия экструзии 1",
  "type": "production",
  "description": "Основной производственный пост"
}
```

Для склада можно использовать:

```json
{
  "name": "Склад сырья",
  "type": "warehouse",
  "description": "Зона хранения сырья"
}
```

---

## BOMs

BOM описывает состав изделия.

```http
GET    /api/v1/catalogs/boms
GET    /api/v1/catalogs/boms/{id}
POST   /api/v1/catalogs/boms
PATCH  /api/v1/catalogs/boms/{id}
DELETE /api/v1/catalogs/boms/{id}
```

Create:

```json
{
  "item_id": 100,
  "name": "BOM Кабель 3x2.5",
  "version": "1.0",
  "status": "active",
  "is_default": true,
  "lines": [
    {
      "component_item_id": 10,
      "quantity": "3.000000",
      "scrap_percent": "1.50"
    }
  ]
}
```

Response содержит:

- `item`;
- `lines`;
- у каждой строки `component_item`.

Важно: при `PATCH` поле `lines`, если передано, заменяет список строк целиком.

---

## Routes

Маршрутный лист описывает цепочку операций для item.

```http
GET    /api/v1/catalogs/routes
GET    /api/v1/catalogs/routes/{id}
POST   /api/v1/catalogs/routes
PATCH  /api/v1/catalogs/routes/{id}
DELETE /api/v1/catalogs/routes/{id}
```

Create:

```json
{
  "item_id": 100,
  "name": "Маршрут Кабель 3x2.5",
  "version": "1.0",
  "status": "active",
  "is_default": true,
  "operations": [
    {
      "operation_number": 10,
      "name": "Экструзия",
      "work_center_id": 1,
      "setup_time_minutes": 15,
      "run_time_minutes": 60,
      "requires_quality_review": true,
      "inputs": [
        {
          "item_id": 10,
          "quantity": "3.000000"
        }
      ],
      "outputs": [
        {
          "item_id": 100,
          "quantity": "1.000000"
        }
      ]
    }
  ]
}
```

Особенности:

- `requires_quality_review=true` означает, что после операции будет создана задача ОТК.
- Если `requires_quality_review=false`, после операции сразу открывается следующий этап.
- При `PATCH` поле `operations`, если передано, заменяет операции целиком.

---

# 8. API: Orders

Заказы находятся под:

```text
/api/v1/orders
```

## Create order

```http
POST /api/v1/orders
```

Payload:

```json
{
  "number": "ORD-001",
  "lines": [
    {
      "item_id": 100,
      "route_id": 5,
      "bom_id": 3,
      "quantity": "100.000000"
    }
  ]
}
```

`bom_id` можно не передавать:

```json
{
  "number": "ORD-001",
  "lines": [
    {
      "item_id": 100,
      "route_id": 5,
      "quantity": "100.000000"
    }
  ]
}
```

Если `bom_id` не передан, backend попробует взять активный default BOM для item.

Backend проверяет:

- item существует и не удален;
- route существует, активен и не удален;
- `route.item_id === line.item_id`;
- если bom передан, он активен, не удален и относится к тому же item.

При создании заказа backend сразу создает задачи.

Response:

```json
{
  "id": 1,
  "number": "ORD-001",
  "status": "created",
  "created_at": "2026-06-15T10:00:00Z",
  "updated_at": "2026-06-15T10:00:00Z",
  "lines": [
    {
      "id": 1,
      "item_id": 100,
      "route_id": 5,
      "bom_id": 3,
      "quantity": "100.000000"
    }
  ]
}
```

## List orders

```http
GET /api/v1/orders?page=1&size=20
```

## Get order

```http
GET /api/v1/orders/{id}
```

---

# 9. API: Tasks

Задачи находятся под:

```text
/api/v1/tasks
```

## List tasks

```http
GET /api/v1/tasks?page=1&size=20
```

Backend сам фильтрует задачи по роли пользователя.

Response:

```json
{
  "items": [
    {
      "id": 1,
      "task_type": "operation",
      "status": "to_do",
      "description": "Экструзия",
      "planned_quantity": "100.000000",
      "actual_quantity": "0.000000",
      "defect_quantity": "0.000000",
      "order_id": 1,
      "order_line_id": 1,
      "item_id": 100,
      "route_operation_id": 12,
      "work_center_id": 1,
      "source_work_center_id": null,
      "target_work_center_id": null,
      "item": {
        "id": 100,
        "name": "Кабель 3x2.5",
        "unit_id": 1
      },
      "work_center": {
        "id": 1,
        "name": "Линия экструзии 1",
        "type": "production"
      },
      "source_work_center": null,
      "target_work_center": null,
      "executor_id": null,
      "created_at": "2026-06-15T10:00:00Z",
      "updated_at": "2026-06-15T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

## Get task

```http
GET /api/v1/tasks/{id}
```

## Update task

```http
PATCH /api/v1/tasks/{id}
```

Payload:

```json
{
  "status": "in_progress"
}
```

Завершение производственной операции:

```json
{
  "status": "done",
  "actual_quantity_delta": "100.000000"
}
```

Блокировка:

```json
{
  "status": "blocked"
}
```

Завершение доставки кладовщиком:

```json
{
  "status": "done"
}
```

Приемка ОТК:

```json
{
  "status": "done"
}
```

Отклонение ОТК:

```json
{
  "status": "rejected",
  "defect_quantity_delta": "3.000000",
  "comment": "Повреждение изоляции"
}
```

Важно:

- `rejected` — это команда, а не статус, который хранится в БД.
- После отклонения backend возвращает производственную операцию в `to_do`.
- Зависимые задачи остаются `waiting`.

---

# 10. Task types

```ts
type TaskType =
  | "warehouse_delivery"
  | "operation"
  | "quality_review"
  | "transfer";
```

## Значение

| task_type | UI label |
|---|---|
| `warehouse_delivery` | Доставка материала со склада |
| `operation` | Производственная операция |
| `quality_review` | Приемка ОТК |
| `transfer` | Перемещение между постами |

---

# 11. Task statuses

```ts
type TaskStatus =
  | "waiting"
  | "to_do"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled";
```

| status | UI label |
|---|---|
| `waiting` | Ожидает предыдущий этап |
| `to_do` | К выполнению |
| `in_progress` | В работе |
| `blocked` | Заблокирована |
| `done` | Выполнена |
| `cancelled` | Отменена |

Обычные пользователи не видят `waiting`.

---

# 12. Поведение задач по ролям

## Storekeeper

Видит:

```text
warehouse_delivery
transfer
```

Может:

```text
to_do -> in_progress
in_progress -> done
in_progress -> blocked
blocked -> in_progress
```

## Operator

Видит:

```text
operation
```

Только по своим `work_center_id`.

Может:

```text
to_do -> in_progress
in_progress -> done
in_progress -> blocked
blocked -> in_progress
```

При завершении operation должен передать:

```json
{
  "status": "done",
  "actual_quantity_delta": "100.000000"
}
```

## Reviewer

Видит:

```text
quality_review
```

Может принять:

```json
{
  "status": "done"
}
```

Может отклонить:

```json
{
  "status": "rejected",
  "defect_quantity_delta": "2.000000",
  "comment": "Причина отклонения"
}
```

## Admin

Видит все.

---

# 13. Recommended frontend architecture

## Folders

Пример структуры:

```text
src/
  app/
    tasks/
      page.tsx
    orders/
      page.tsx
      new/
        page.tsx
    catalogs/
      units/
        page.tsx
      items/
        page.tsx
      work-centers/
        page.tsx
      boms/
        page.tsx
      routes/
        page.tsx
    admin/
      users/
        page.tsx

  entities/
    task/
      api.ts
      types.ts
      mappers.ts
    order/
      api.ts
      types.ts
      mappers.ts
    catalog/
      api.ts
      types.ts

  shared/
    api/
      fetcher.ts
    i18n/
      labels.ts
    navigation/
      navigation.ts
    ui/
      MobileNavigationDrawer.tsx
      AppShell.tsx
```

---

# 14. TypeScript DTOs

## Pagination

```ts
export type ListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
};
```

## Task

```ts
export type TaskType =
  | "warehouse_delivery"
  | "operation"
  | "quality_review"
  | "transfer";

export type TaskStatus =
  | "waiting"
  | "to_do"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled";

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
  work_center_id: number | null;
  source_work_center_id: number | null;
  target_work_center_id: number | null;
  item: {
    id: number;
    name: string;
    unit_id: number;
  };
  work_center: WorkCenterDto | null;
  source_work_center: WorkCenterDto | null;
  target_work_center: WorkCenterDto | null;
  executor_id: number | null;
  created_at: string;
  updated_at: string;
};
```

## Order

```ts
export type CreateOrderPayload = {
  number: string;
  lines: {
    item_id: number;
    route_id: number;
    bom_id?: number | null;
    quantity: string;
  }[];
};
```

---

# 15. Forms

## Общие правила

- Все `Decimal` значения отправлять строками:
  ```json
  "100.000000"
  ```
- Для `select` использовать id.
- Отображать рядом человекочитаемое имя из вложенного объекта или из загруженного справочника.

Пример:

```tsx
<Select.Root value={String(itemId)} onValueChange={(v) => setItemId(Number(v))}>
  {items.map((item) => (
    <Select.Item key={item.id} value={String(item.id)}>
      {item.name}
    </Select.Item>
  ))}
</Select.Root>
```

---

# 16. UI для задач

## Карточка задачи должна показывать

- тип задачи;
- статус;
- заказ;
- item;
- плановое количество;
- рабочий центр;
- для transfer:
  - откуда;
  - куда;
- действия, доступные по роли и статусу.

## Действия

Для `to_do`:

```text
Взять в работу
```

Для `in_progress`:

```text
Завершить
Заблокировать
```

Для `blocked`:

```text
Возобновить
```

Для `quality_review`:

```text
Принять
Отклонить
```

---

# 17. Error handling

Backend может вернуть:

## 401

Пользователь не авторизован.

UI:
- отправить на login.

## 403

Нет доступа.

UI:
- показать сообщение;
- можно обновить список задач.

## 404

Сущность не найдена.

UI:
- показать not found;
- для модального окна закрыть и обновить список.

## 409

Конфликт бизнес-правила.

Примеры:
- order number уже существует;
- route не active;
- BOM не active.

## 422

Ошибка валидации.

Примеры:
- route item не совпадает с item строки заказа;
- при завершении operation не передано actual quantity;
- при reject ОТК не передано defect quantity.

---

# 18. Caching strategy

## Можно кэшировать

Справочники:

```text
units
items
work-centers
boms
routes
```

Особенно для select-ов.

Рекомендуется:
- грузить в server component;
- кэшировать через Next.js fetch cache или собственный server-side data layer;
- инвалидировать после create/update/delete.

## Нельзя агрессивно кэшировать

```text
tasks
orders
```

Задачи меняются после каждого действия.

Для задач лучше:

```ts
cache: "no-store"
```

или короткий revalidate.

---

# 19. Важные UX-сценарии

## Создание заказа

Форма:

1. Номер заказа.
2. Строки заказа:
   - item;
   - route;
   - optional BOM;
   - quantity.
3. При выборе item фильтровать routes по `route.item_id`.
4. BOM можно подставлять default, если есть.
5. После создания перейти на страницу заказа или задач.

## Создание маршрутного листа

Форма route:

1. item;
2. name;
3. version;
4. status;
5. is_default;
6. операции:
   - operation_number;
   - name;
   - work_center;
   - setup/run time;
   - requires_quality_review;
   - inputs;
   - outputs.

Важно: inputs/outputs выбираются из items по id.

## Работа сотрудника с задачей

1. Пользователь открывает `/tasks`.
2. Backend возвращает только доступные задачи.
3. Пользователь берет задачу в работу.
4. После выполнения отправляет `PATCH`.
5. UI обновляет список.

---

# 20. Главное правило интеграции

Фронт не должен самостоятельно воспроизводить workflow создания задач.

Не нужно на фронте:
- рассчитывать зависимости;
- создавать задачи;
- решать, какая задача следующая;
- открывать/скрывать задачи.

Фронт должен:
- корректно заполнить справочники;
- создать маршрут;
- создать заказ;
- отображать задачи;
- отправлять действия пользователя по задачам.

Backend отвечает за workflow.