'use client';

import { DataTable } from '@/components/data-table';
import { Disclosure } from '@/components/disclosure';
import type { ItemDto } from '@/types/api';
import { Button, Text } from '@radix-ui/themes';
import { ChevronRight } from 'lucide-react';
export function ItemsTable({
  items,
  onOpen,
  variants = false,
  label,
}: {
  items: ItemDto[];
  onOpen: (item: ItemDto) => void;
  variants?: boolean;
  label?: string;
}) {
  return (
    <DataTable
      rows={items}
      rowKey={(item) => item.id}
      label={label}
      columns={[
        {
          key: 'name',
          header: 'Название',
          cell: (item) => (variants ? item.name : <Text weight="medium">{item.name}</Text>),
        },
        { key: 'unit', header: 'Единица', cell: (item) => item.unit.symbol },
        {
          key: 'description',
          header: 'Описание',
          cell: (item) => (
            <>
              <Text as="div" color={item.description ? undefined : 'gray'}>
                {item.description || 'Описание не указано'}
              </Text>
              {item.labor_minutes != null && (
                <Text as="div" size="2" color="gray" mt="1">
                  Трудоёмкость: {item.labor_minutes} мин
                </Text>
              )}
            </>
          ),
        },
        { key: 'product', header: 'Изделие', cell: (item) => (item.is_product ? 'Да' : 'Нет') },
        {
          key: 'actions',
          header: '',
          cell: (item) => (
            <Button size="2" variant="soft" onClick={() => onOpen(item)}>
              Открыть <ChevronRight size={15} />
            </Button>
          ),
        },
      ]}
      expandedRow={
        variants
          ? undefined
          : (item) =>
              item.variants.length ? (
                <Disclosure title={<>Варианты ({item.variants.length})</>}>
                  <ItemsTable
                    items={item.variants}
                    variants
                    onOpen={onOpen}
                    label={'Варианты ' + item.name}
                  />
                </Disclosure>
              ) : null
      }
    />
  );
}
