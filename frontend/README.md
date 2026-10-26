# Frontend

Next.js App Router, React и Radix UI Themes. Маршруты находятся в `app`, предметные блоки — в `app/features`, общие элементы — в `app/components`.

## Структура страницы

Для страниц используется один порядок чтения:

1. `page.tsx` вызывает хук страницы и показывает порядок блоков.
2. `features/<раздел>/use-page.ts` хранит данные, состояние загрузки, ошибок и форм; вызывает API и обрабатывает действия.
3. `features/<раздел>/model.ts` содержит типы черновиков, начальные значения, проверки и чистые преобразования формы в API payload.
4. `features/<раздел>/sections.tsx` описывает блоки страницы. Большие редакторы вынесены в соседние файлы.

Например, создание заказа: `app/(protected)/orders/new/page.tsx` → `features/orders/create/use-page.ts` → `sections.tsx` и `order-line.tsx`. Обработчики добавления, изменения и удаления строк находятся в хуке; `toOrderPayload` собирает запрос.

`app/lib/api.ts` отвечает за HTTP и DTO. `app/lib/view-models.ts` преобразует ответы в данные для отображения: подписи дат и количеств, имена номенклатуры, незавершённые зависимости. Исходные поля и строки сохраняются. `app/lib/format.ts` содержит общие форматтеры. Загрузка дерева спецификации с API находится отдельно в `features/catalogs/items/load-tree.ts`.

## Компоненты и оформление

- `DataTable<T>` принимает `rows`, `columns`, `rowKey` и при необходимости `expandedRow`. Колонка описывает заголовок и содержимое ячейки. Внутри используется Radix Table.
- `FormField`, `Field`, `SelectField`, `CheckboxField` — общие поля форм на Radix.
- `NameCatalogForm` и `NameCatalogTable` — общие формы и таблицы справочников с названием.
- `PageLayout`, `PageHeader`, `Pagination`, `Detail`, состояния загрузки и ошибок используются повторно.
- `Disclosure` использует Radix Collapsible; подтверждение удаления — Radix AlertDialog. Закрытие раскрываемого блока сохраняет введённые значения.

Цвета и размеры задаются темой Radix, расположение — свойствами `Flex`, `Grid`, `Box`, `Container`, `Card`. В `globals.css` оставлен только сброс отступа `body`. HTML `form`, `label`, `main`, `aside` и `button` внутри `Card asChild` сохраняют семантику элементов.

## Проверки

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Тесты в `tests/models.test.ts` проверяют преобразования API и форм: состав строк заказа, десятичные количества, копирование маршрутов, зависимости задач, роли и рабочие посты, вход и переход после входа.
