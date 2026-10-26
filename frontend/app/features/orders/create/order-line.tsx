'use client';

import { FormField, SelectField } from '@/components/form-fields';
import type { ItemDto } from '@/types/api';
import { Button, Card, Flex, Grid, Heading, TextField } from '@radix-ui/themes';
import { Trash2 } from 'lucide-react';
import type { DraftLine } from './model';
export function OrderLine({
  line,
  index,
  items,
  canDelete,
  onChange,
  onDelete,
}: {
  line: DraftLine;
  index: number;
  items: ItemDto[];
  canDelete: boolean;
  onChange: (patch: Partial<DraftLine>) => void;
  onDelete: () => void;
}) {
  const main = items.find((item) => String(item.id) === line.main_id);
  const variants = main
    ? [main, ...main.variants].map((item) => ({
        id: item.id,
        name: item.name + (item.is_main ? ' (главная)' : ''),
      }))
    : [];
  return (
    <Card size="2">
      <Flex align="center" justify="between" mb="3">
        <Heading size="3">Строка {index + 1}</Heading>
        <Button
          type="button"
          size="2"
          variant="soft"
          color="red"
          disabled={!canDelete}
          onClick={onDelete}
        >
          <Trash2 size={15} />
          Удалить
        </Button>
      </Flex>
      <Grid columns={{ initial: '1', md: '2' }} gap="3">
        <SelectField
          label="Главная номенклатура"
          value={line.main_id}
          options={items}
          onChange={(value) => onChange({ main_id: value, item_id: value })}
        />
        {main?.variants.length ? (
          <SelectField
            label="Номенклатура из группы"
            value={line.item_id}
            options={variants}
            onChange={(value) => onChange({ item_id: value })}
          />
        ) : null}
        <FormField label="Количество">
          <TextField.Root
            name={'quantity-' + line.id}
            inputMode="decimal"
            defaultValue={line.quantity}
            required
          />
        </FormField>
      </Grid>
    </Card>
  );
}
