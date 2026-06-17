Ниже полный список реально подключённых API-эндпойнтов из `app/main.py`.

Общее:
- base prefix: `/api/v1`
- защищённые методы читают JWT из HttpOnly cookie `access_token`
- `/api/v1/refresh` читает `refresh_token` из cookie
- `DELETE` обычно возвращает `204 No Content`, тело пустое
- ошибки FastAPI обычно вида:

```json
{
  "detail": "Not authenticated"
}
```

**Auth**
`POST /api/v1/login`

Request:

```json
{
  "login": "admin",
  "password": "supersecret"
}
```

Response:

```json
{
  "access_token": "jwt...",
  "refresh_token": "jwt...",
  "token_type": "bearer",
  "expires_in": 900
}
```

Также ставит cookies `access_token` и `refresh_token`.

`POST /api/v1/refresh`

Request body не нужен. Нужна cookie `refresh_token`.

Response:

```json
{
  "access_token": "new-jwt...",
  "refresh_token": "new-refresh-jwt...",
  "token_type": "bearer",
  "expires_in": 900
}
```

`GET /api/v1/me`

Response:

```json
{
  "id": 1,
  "username": "admin",
  "full_name": "Admin User",
  "role": "admin",
  "workstation_ids": [1, 2]
}
```

`POST /api/v1/logout`

Request body не нужен. Response: `204 No Content`.

**Sensors / Values**
Не требуют авторизации.

`POST /api/v1/values`

Request: объект, где ключ это Unix timestamp в секундах или миллисекундах, значение массив строк формата `<code> <ch1> <ch2> <ch3>`. Значения каналов: int или `NULL`.

```json
{
  "1718520000": [
    "1 100 200 NULL",
    "2 10 NULL 30"
  ]
}
```

Response:

```json
{
  "status": "ok",
  "accepted_timestamps": 1,
  "accepted_lines": 2,
  "parsed_values": 4,
  "to_insert": 4
}
```

`GET /api/v1/values?start=1718520000&end=1718523600`

Response:

```json
{
  "1718520000": [
    "1 100 200 NULL",
    "2 10 NULL 30"
  ]
}
```

**Admin**
Все методы требуют роль `admin`.

`POST /api/v1/admin/users`

Request:

```json
{
  "full_name": "Иванов Иван Иванович",
  "password": "secret123",
  "role": "operator"
}
```

`role`: `operator`, `reviewer`, `storekeeper`.

Response:

```json
{
  "id": 2,
  "username": "IvanovII",
  "full_name": "Иванов Иван Иванович",
  "role": "operator",
  "workstations": []
}
```

`PATCH /api/v1/admin/users/{id}`

Request, все поля опциональны, но хотя бы одно нужно передать:

```json
{
  "password": "newsecret123",
  "role": "operator",
  "workstation_ids": [1, 2]
}
```

Response такой же, как у создания пользователя.

`GET /api/v1/admin/users?page=1&size=20`

`size`: от 5 до 100.

Response:

```json
{
  "items": [
    {
      "id": 2,
      "username": "IvanovII",
      "full_name": "Иванов Иван Иванович",
      "role": "operator",
      "workstations": [
        {
          "id": 1,
          "name": "Линия 1"
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

`GET /api/v1/admin/workstations`

Response:

```json
[
  {
    "id": 1,
    "name": "Линия 1"
  }
]
```

`POST /api/v1/admin/workstations`

Request:

```json
{
  "name": "Линия 1"
}
```

Response:

```json
{
  "id": 1,
  "name": "Линия 1"
}
```

`DELETE /api/v1/admin/workstations/{id}`

Response: `204 No Content`.

**Catalogs: Units**
Общие query для списков: `page=1`, `size=20`, `include_deleted=false`.

`GET /api/v1/catalogs/units?page=1&size=20&include_deleted=false`

Response:

```json
{
  "items": [
    {
      "id": 1,
      "name": "Килограмм",
      "symbol": "кг",
      "created_at": "2026-06-16T08:00:00Z",
      "updated_at": "2026-06-16T08:00:00Z",
      "deleted_at": null
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

`GET /api/v1/catalogs/units/{id}`

Response: один объект `UnitResponse`.

`POST /api/v1/catalogs/units`

Request:

```json
{
  "name": "Килограмм",
  "symbol": "кг"
}
```

Response: `UnitResponse`.

`PATCH /api/v1/catalogs/units/{id}`

Request:

```json
{
  "name": "Грамм",
  "symbol": "г"
}
```

Response: `UnitResponse`.

`DELETE /api/v1/catalogs/units/{id}`

Response: `204 No Content`.

**Catalogs: Items**
`GET /api/v1/catalogs/items?page=1&size=20&include_deleted=false`

Response:

```json
{
  "items": [
    {
      "id": 1,
      "name": "Медь",
      "unit_id": 1,
      "description": "Сырье",
      "unit": {
        "id": 1,
        "name": "Килограмм",
        "symbol": "кг"
      },
      "created_at": "2026-06-16T08:00:00Z",
      "updated_at": "2026-06-16T08:00:00Z",
      "deleted_at": null
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

`GET /api/v1/catalogs/items/{id}`

`POST /api/v1/catalogs/items`

Request:

```json
{
  "name": "Медь",
  "unit_id": 1,
  "description": "Сырье"
}
```

`PATCH /api/v1/catalogs/items/{id}`

Request:

```json
{
  "name": "Медь М1",
  "unit_id": 1,
  "description": "Обновленное описание"
}
```

`DELETE /api/v1/catalogs/items/{id}`

Response: `204 No Content`.

**Catalogs: Work Centers**
`GET /api/v1/catalogs/work-centers?page=1&size=20&include_deleted=false`

`GET /api/v1/catalogs/work-centers/{id}`

Response example:

```json
{
  "id": 1,
  "name": "Волочение",
  "type": "production",
  "description": "Участок волочения",
  "created_at": "2026-06-16T08:00:00Z",
  "updated_at": "2026-06-16T08:00:00Z",
  "deleted_at": null
}
```

`POST /api/v1/catalogs/work-centers`

Request:

```json
{
  "name": "Волочение",
  "type": "production",
  "description": "Участок волочения"
}
```

`PATCH /api/v1/catalogs/work-centers/{id}`

Request:

```json
{
  "name": "Волочение 1",
  "type": "production",
  "description": null
}
```

`DELETE /api/v1/catalogs/work-centers/{id}`

Response: `204 No Content`.

**Catalogs: BOMs**
`GET /api/v1/catalogs/boms?page=1&size=20&include_deleted=false`

`GET /api/v1/catalogs/boms/{id}`

Response example:

```json
{
  "id": 1,
  "item_id": 2,
  "name": "BOM кабель",
  "version": "1.0",
  "status": "active",
  "is_default": true,
  "item": {
    "id": 2,
    "name": "Кабель",
    "unit_id": 1,
    "description": null
  },
  "created_at": "2026-06-16T08:00:00Z",
  "updated_at": "2026-06-16T08:00:00Z",
  "deleted_at": null,
  "lines": [
    {
      "id": 1,
      "component_item_id": 1,
      "quantity": "2.500000",
      "scrap_percent": "1.50",
      "component_item": {
        "id": 1,
        "name": "Медь",
        "unit_id": 1,
        "description": "Сырье"
      }
    }
  ]
}
```

`POST /api/v1/catalogs/boms`

Request:

```json
{
  "item_id": 2,
  "name": "BOM кабель",
  "version": "1.0",
  "status": "active",
  "is_default": true,
  "lines": [
    {
      "component_item_id": 1,
      "quantity": "2.5",
      "scrap_percent": "1.5"
    }
  ]
}
```

`PATCH /api/v1/catalogs/boms/{id}`

Request:

```json
{
  "status": "inactive",
  "is_default": false,
  "lines": [
    {
      "component_item_id": 1,
      "quantity": "2.7",
      "scrap_percent": "2.0"
    }
  ]
}
```

`DELETE /api/v1/catalogs/boms/{id}`

Response: `204 No Content`.

**Catalogs: Routes**
`GET /api/v1/catalogs/routes?page=1&size=20&include_deleted=false`

`GET /api/v1/catalogs/routes/{id}`

Response example:

```json
{
  "id": 1,
  "item_id": 2,
  "name": "Маршрут кабеля",
  "version": "1.0",
  "status": "active",
  "is_default": true,
  "item": {
    "id": 2,
    "name": "Кабель",
    "unit_id": 1,
    "description": null
  },
  "created_at": "2026-06-16T08:00:00Z",
  "updated_at": "2026-06-16T08:00:00Z",
  "deleted_at": null,
  "operations": [
    {
      "id": 1,
      "operation_number": 10,
      "name": "Волочение",
      "work_center_id": 1,
      "setup_time_minutes": 15,
      "run_time_minutes": 60,
      "requires_quality_review": true,
      "work_center": {
        "id": 1,
        "name": "Волочение",
        "type": "production",
        "description": "Участок волочения"
      },
      "inputs": [
        {
          "id": 1,
          "item_id": 1,
          "quantity": "2.500000",
          "item": {
            "id": 1,
            "name": "Медь",
            "unit_id": 1,
            "description": "Сырье"
          }
        }
      ],
      "outputs": [
        {
          "id": 1,
          "item_id": 2,
          "quantity": "1.000000",
          "item": {
            "id": 2,
            "name": "Кабель",
            "unit_id": 1,
            "description": null
          }
        }
      ]
    }
  ]
}
```

`POST /api/v1/catalogs/routes`

Request:

```json
{
  "item_id": 2,
  "name": "Маршрут кабеля",
  "version": "1.0",
  "status": "active",
  "is_default": true,
  "operations": [
    {
      "operation_number": 10,
      "name": "Волочение",
      "work_center_id": 1,
      "setup_time_minutes": 15,
      "run_time_minutes": 60,
      "requires_quality_review": true,
      "inputs": [
        {
          "item_id": 1,
          "quantity": "2.5"
        }
      ],
      "outputs": [
        {
          "item_id": 2,
          "quantity": "1"
        }
      ]
    }
  ]
}
```

`PATCH /api/v1/catalogs/routes/{id}`

Request:

```json
{
  "status": "inactive",
  "operations": [
    {
      "operation_number": 10,
      "name": "Волочение",
      "work_center_id": 1,
      "setup_time_minutes": 20,
      "run_time_minutes": 70,
      "requires_quality_review": true,
      "inputs": [],
      "outputs": []
    }
  ]
}
```

`DELETE /api/v1/catalogs/routes/{id}`

Response: `204 No Content`.

**Orders**
`POST /api/v1/orders`

Request:

```json
{
  "number": "ORD-2026-001",
  "lines": [
    {
      "item_id": 2,
      "route_id": 1,
      "bom_id": 1,
      "quantity": "100"
    }
  ]
}
```

`bom_id` можно не передавать или передать `null`, тогда сервис попробует взять default active BOM.

Response:

```json
{
  "id": 1,
  "number": "ORD-2026-001",
  "status": "created",
  "created_at": "2026-06-16T08:00:00Z",
  "updated_at": "2026-06-16T08:00:00Z",
  "lines": [
    {
      "id": 1,
      "item_id": 2,
      "route_id": 1,
      "bom_id": 1,
      "quantity": "100.000000"
    }
  ]
}
```

При создании заказа автоматически создаются задачи по маршруту.

`GET /api/v1/orders?page=1&size=20`

Response:

```json
{
  "items": [
    {
      "id": 1,
      "number": "ORD-2026-001",
      "status": "created",
      "created_at": "2026-06-16T08:00:00Z",
      "updated_at": "2026-06-16T08:00:00Z",
      "lines": []
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

`GET /api/v1/orders/{id}`

Response: один `OrderResponse`.

**Tasks**
`GET /api/v1/tasks?page=1&size=20`

`size`: от 5 до 100.

Response:

```json
{
  "items": [
    {
      "id": 1,
      "task_type": "operation",
      "status": "to_do",
      "description": "Волочение",
      "planned_quantity": "100.000000",
      "actual_quantity": "0.000000",
      "defect_quantity": "0.000000",
      "order_id": 1,
      "order_line_id": 1,
      "item_id": 2,
      "route_operation_id": 1,
      "work_center_id": 1,
      "source_work_center_id": null,
      "target_work_center_id": null,
      "item": {
        "id": 2,
        "name": "Кабель",
        "unit_id": 1
      },
      "work_center": {
        "id": 1,
        "name": "Волочение",
        "type": "production"
      },
      "source_work_center": null,
      "target_work_center": null,
      "executor_id": null,
      "created_at": "2026-06-16T08:00:00Z",
      "updated_at": "2026-06-16T08:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

`GET /api/v1/tasks/{id}`

Response: один `TaskResponse`.

`PATCH /api/v1/tasks/{id}`

Request:

```json
{
  "status": "in_progress",
  "actual_quantity_delta": null,
  "defect_quantity_delta": null,
  "comment": null
}
```

Допустимые `status` в запросе:

```json
[
  "to_do",
  "in_progress",
  "blocked",
  "done",
  "cancelled",
  "rejected"
]
```

Пример завершения операции оператором:

```json
{
  "status": "done",
  "actual_quantity_delta": "100",
  "comment": null
}
```

Пример отклонения контроля качества reviewer-ом:

```json
{
  "status": "rejected",
  "defect_quantity_delta": "5",
  "comment": "Обнаружен дефект"
}
```

Response: обновлённый `TaskResponse`.

Важные ограничения по задачам:
- `operator` видит и меняет только `operation` на своих `workstation_ids`
- `reviewer` работает с `quality_review`
- `storekeeper` работает с `warehouse_delivery` и `transfer`
- `admin` видит все задачи, но не все переходы ролей разрешены бизнес-правилами
- `actual_quantity_delta` может ставить только `operator` и только для `operation`
- `defect_quantity_delta` и `comment` может ставить только `reviewer`
- при `operator -> done` поле `actual_quantity_delta` обязательно