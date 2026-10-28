'use client';

import { FormField, SelectField } from '@/components/form-fields';
import { orderPriorityLabels } from '@/lib/order-planning';
import type { OrderPriority } from '@/types/api';
import { Text, TextField } from '@radix-ui/themes';

export function OrderPlanningFields({
  priority = 'medium',
  deadlineDate = null,
  disabled = false,
}: {
  priority?: OrderPriority | null;
  deadlineDate?: string | null;
  disabled?: boolean;
}) {
  return (
    <>
      <SelectField
        label="Приоритет"
        name="priority"
        defaultValue={priority ?? 'none'}
        disabled={disabled}
        options={[
          { id: 'none', name: 'Не задан' },
          ...Object.entries(orderPriorityLabels).map(([id, name]) => ({ id, name })),
        ]}
      />
      <FormField label="Дедлайн">
        <TextField.Root
          name="deadline"
          type="date"
          max="9999-12-31"
          defaultValue={deadlineDate ?? ''}
          placeholder="Не задан"
          disabled={disabled}
        />
        <Text size="1" color="gray">
          Дата без времени. Оставьте пустым, если дедлайн не задан.
        </Text>
      </FormField>
    </>
  );
}
