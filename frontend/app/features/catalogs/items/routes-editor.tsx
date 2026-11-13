'use client';

import { Field, FormField, SelectField } from '@/components/form-fields';
import type { ItemDto, OperationTypeDto, WorkstationDto } from '@/types/api';
import { Button, Card, Flex, Text, TextField } from '@radix-ui/themes';
import { Plus, Trash2 } from 'lucide-react';
import { MaterialSource } from './material-source';
import type { ItemRouteDraft } from './model';
type References = { items: ItemDto[]; operations: OperationTypeDto[]; posts: WorkstationDto[] };
type Step = ItemRouteDraft['steps'][number];
type Material = Step['materials'][number];
const newStep = (refs: References): Step => ({
  operation_type_id: refs.operations[0]?.id ?? 0,
  workstation_id: refs.posts[0]?.id ?? 0,
  labor_minutes: '',
  materials: [],
});
export function RoutesEditor({
  routes,
  onChange,
  ...refs
}: References & { routes: ItemRouteDraft[]; onChange: (routes: ItemRouteDraft[]) => void }) {
  function edit(index: number, route: ItemRouteDraft) {
    onChange(routes.map((current, i) => (i === index ? route : current)));
  }
  return (
    <Card>
      <Text weight="medium">Маршруты</Text>
      <Text as="p" size="2" color="gray" mt="2">
        Результат каждого шага целиком передаётся следующему. Первый шаг должен содержать материалы.
        Ссылка на результат маршрута означает ожидание его завершения перед началом этого маршрута.
      </Text>
      {routes.map((route, index) => (
        <RouteEditor
          key={route.key}
          route={route}
          routes={routes}
          refs={refs}
          onChange={(value) => edit(index, value)}
          onDelete={() => onChange(routes.filter((_, i) => i !== index))}
        />
      ))}
      <Button
        mt="3"
        variant="soft"
        onClick={() =>
          onChange([
            ...routes,
            {
              key: crypto.randomUUID(),
              name: 'Маршрут ' + (routes.length + 1),
              output_quantity: '1',
              steps: [newStep(refs)],
            },
          ])
        }
      >
        <Plus size={15} />
        Добавить маршрут
      </Button>
    </Card>
  );
}
function RouteEditor({
  route,
  routes,
  refs,
  onChange,
  onDelete,
}: {
  route: ItemRouteDraft;
  routes: ItemRouteDraft[];
  refs: References;
  onChange: (route: ItemRouteDraft) => void;
  onDelete: () => void;
}) {
  function editStep(index: number, step: Step) {
    onChange({
      ...route,
      steps: route.steps.map((current, i) => (i === index ? step : current)),
    });
  }
  function move(index: number, offset: number) {
    const steps = [...route.steps];
    [steps[index], steps[index + offset]] = [steps[index + offset], steps[index]];
    onChange({ ...route, steps });
  }
  return (
    <Card mt="3">
      <Flex gap="3" align="end" wrap="wrap">
        <Field
          label="Название маршрута"
          value={route.name}
          onChange={(name) => onChange({ ...route, name })}
        />
        <Field
          label="Количество результата"
          value={String(route.output_quantity)}
          onChange={(output_quantity) => onChange({ ...route, output_quantity })}
        />
        <Button color="red" variant="soft" onClick={onDelete}>
          Удалить маршрут
        </Button>
      </Flex>
      {route.steps.map((step, index) => (
        <StepEditor
          key={index}
          step={step}
          index={index}
          count={route.steps.length}
          routes={routes.filter((r) => r.key !== route.key)}
          refs={refs}
          onChange={(value) => editStep(index, value)}
          onMove={(offset) => move(index, offset)}
          onDelete={() => onChange({ ...route, steps: route.steps.filter((_, i) => i !== index) })}
        />
      ))}
      <Button
        mt="3"
        variant="soft"
        onClick={() => onChange({ ...route, steps: [...route.steps, newStep(refs)] })}
      >
        Добавить шаг
      </Button>
    </Card>
  );
}
function StepEditor({
  step,
  index,
  count,
  routes,
  refs,
  onChange,
  onMove,
  onDelete,
}: {
  step: Step;
  index: number;
  count: number;
  routes: ItemRouteDraft[];
  refs: References;
  onChange: (step: Step) => void;
  onMove: (offset: number) => void;
  onDelete: () => void;
}) {
  return (
    <Card mt="3">
      <Flex justify="between" align="center" mb="3" gap="3" wrap="wrap">
        <Text weight="medium">Шаг {index + 1}</Text>
        <Flex gap="2" wrap="wrap">
          <Button variant="soft" disabled={!index} onClick={() => onMove(-1)}>
            Выше
          </Button>
          <Button variant="soft" disabled={index === count - 1} onClick={() => onMove(1)}>
            Ниже
          </Button>
          <Button color="red" variant="soft" onClick={onDelete}>
            Удалить шаг
          </Button>
        </Flex>
      </Flex>
      <Flex gap="3" wrap="wrap">
        <SelectField
          label="Операция"
          value={step.operation_type_id ? String(step.operation_type_id) : ''}
          options={refs.operations}
          onChange={(value) => onChange({ ...step, operation_type_id: Number(value) })}
        />
        <SelectField
          label="Рабочий пост"
          value={step.workstation_id ? String(step.workstation_id) : ''}
          options={refs.posts}
          onChange={(value) => onChange({ ...step, workstation_id: Number(value) })}
        />
        <FormField label="Трудоёмкость (мин, необязательно)">
          <TextField.Root
            type="number"
            min={0}
            max={2147483647}
            step={1}
            placeholder="Не указана"
            value={step.labor_minutes}
            onChange={(event) => onChange({ ...step, labor_minutes: event.target.value })}
          />
        </FormField>
      </Flex>
      <Text as="p" size="2" mt="3">
        Материалы{index === 0 ? ' (обязательны)' : ' + результат предыдущего шага'}
      </Text>
      {step.materials.map((material, i) => (
        <MaterialRow
          key={i}
          material={material}
          items={refs.items}
          routes={routes}
          onChange={(value) =>
            onChange({
              ...step,
              materials: step.materials.map((current, j) => (j === i ? value : current)),
            })
          }
          onDelete={() =>
            onChange({ ...step, materials: step.materials.filter((_, j) => j !== i) })
          }
        />
      ))}
      <Button
        mt="3"
        variant="soft"
        onClick={() =>
          onChange({
            ...step,
            materials: [
              ...step.materials,
              {
                input_item_id: refs.items[0]?.id ?? null,
                source_route_key: null,
                quantity: '1',
              },
            ],
          })
        }
      >
        Добавить материал
      </Button>
    </Card>
  );
}
function MaterialRow({
  material,
  items,
  routes,
  onChange,
  onDelete,
}: {
  material: Material;
  items: ItemDto[];
  routes: ItemRouteDraft[];
  onChange: (material: Material) => void;
  onDelete: () => void;
}) {
  return (
    <Flex gap="3" align="end" wrap="wrap" mt="2">
      <MaterialSource material={material} items={items} routes={routes} onChange={onChange} />
      <Field
        label="Количество"
        value={String(material.quantity)}
        onChange={(quantity) => onChange({ ...material, quantity })}
      />
      <Button color="red" variant="soft" onClick={onDelete}>
        <Trash2 size={15} />
        Удалить
      </Button>
    </Flex>
  );
}
