'use client';

import { FormField } from '@/components/form-fields';
import type { ItemDto, ItemRoute, RouteMaterial } from '@/types/api';
import { Select } from '@radix-ui/themes';
export function MaterialSource({
  material,
  items,
  routes,
  onChange,
}: {
  material: RouteMaterial;
  items: ItemDto[];
  routes: ItemRoute[];
  onChange: (material: RouteMaterial) => void;
}) {
  const value = material.source_route_key
    ? 'route:' + material.source_route_key
    : material.input_item_id
      ? 'item:' + material.input_item_id
      : '';
  return (
    <FormField label="Источник материала">
      <Select.Root
        value={value}
        onValueChange={(value) =>
          onChange({
            ...material,
            input_item_id: value.startsWith('item:') ? Number(value.slice(5)) : null,
            source_route_key: value.startsWith('route:') ? value.slice(6) : null,
          })
        }
      >
        <Select.Trigger placeholder="Выберите источник" />
        <Select.Content>
          <Select.Group>
            <Select.Label>Номенклатура</Select.Label>
            {items.map((item) => (
              <Select.Item key={item.id} value={'item:' + item.id}>
                {item.name}
              </Select.Item>
            ))}
          </Select.Group>
          <Select.Group>
            <Select.Label>Результат маршрута</Select.Label>
            {routes.map((route) => (
              <Select.Item key={route.key} value={'route:' + route.key}>
                {route.name || 'Без названия'}
              </Select.Item>
            ))}
          </Select.Group>
        </Select.Content>
      </Select.Root>
    </FormField>
  );
}
