'use client';

import { Button, Card, Flex, Grid, TextField } from '@radix-ui/themes';
import { Plus, Save } from 'lucide-react';
import type { FormEvent } from 'react';
import { DataTable } from './data-table';
import { FormField } from './form-fields';
type NamedRecord = { id: number; name: string };
export function NameCatalogForm({
  submitting,
  onSubmit,
}: {
  submitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card size="3" mb="4">
      <form onSubmit={onSubmit}>
        <Grid columns={{ initial: '1', md: '3' }} gap="3" align="end">
          <FormField label="Название">
            <TextField.Root name="name" required maxLength={256} />
          </FormField>
          <Button type="submit" disabled={submitting}>
            <Plus size={16} />
            Создать
          </Button>
        </Grid>
      </form>
    </Card>
  );
}
export function NameCatalogTable({
  items,
  prefix,
  submitting,
  onUpdate,
}: {
  items: NamedRecord[];
  prefix: string;
  submitting: boolean;
  onUpdate: (item: NamedRecord, event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <DataTable
      rows={items}
      rowKey={(item) => item.id}
      columns={[
        {
          key: 'name',
          header: 'Название',
          cell: (item) => (
            <TextField.Root form={prefix + '-' + item.id} name="name" defaultValue={item.name} />
          ),
        },
        {
          key: 'actions',
          header: '',
          cell: (item) => (
            <form id={prefix + '-' + item.id} onSubmit={(event) => onUpdate(item, event)}>
              <Flex gap="2">
                <Button size="2" variant="soft" type="submit" disabled={submitting}>
                  <Save size={15} />
                  Сохранить
                </Button>
              </Flex>
            </form>
          ),
        },
      ]}
    />
  );
}
