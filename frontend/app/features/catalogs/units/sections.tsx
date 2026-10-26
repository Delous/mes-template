'use client';

import { CatalogNav } from '@/components/catalog-nav';
import { DataTable } from '@/components/data-table';
import { CheckboxField, FormField } from '@/components/form-fields';
import {
  DeleteButton,
  EmptyState,
  ErrorNotice,
  LoadingState,
  PageHeader,
  Pagination,
} from '@/components/page-tools';
import { Badge, Button, Card, Flex, Grid, TextField } from '@radix-ui/themes';
import { Plus, Save } from 'lucide-react';
import { pageSize } from './model';
import type { PageModel } from './use-page';
export function PageHeading() {
  return <PageHeader title="Единицы измерения" />;
}

export function PageNavigation() {
  return <CatalogNav />;
}

export function PageError({ model }: { model: Pick<PageModel, 'error'> }) {
  const { error } = model;
  return <ErrorNotice message={error} />;
}

export function PageFilters({
  model,
}: {
  model: Pick<PageModel, 'includeDeleted' | 'setIncludeDeleted'>;
}) {
  const { includeDeleted, setIncludeDeleted } = model;
  return <IncludeDeleted checked={includeDeleted} onCheckedChange={setIncludeDeleted} />;
}

export function CreateUnitForm({
  model,
}: {
  model: Pick<PageModel, 'submitting' | 'handleCreate'>;
}) {
  const { submitting, handleCreate } = model;
  return (
    <Card size="3" mb="4">
      <form onSubmit={handleCreate}>
        <Grid columns={{ initial: '1', md: '3' }} gap="3" align="end">
          <FormField label={'Название'}>
            <TextField.Root name="name" mt="2" required maxLength={256} />
          </FormField>
          <FormField label={'Обозначение'}>
            <TextField.Root name="symbol" mt="2" required maxLength={32} />
          </FormField>
          <Button type="submit" disabled={submitting}>
            <Plus size={16} /> Создать
          </Button>
        </Grid>
      </form>
    </Card>
  );
}

export function UnitsTable({
  model,
}: {
  model: Pick<
    PageModel,
    | 'items'
    | 'page'
    | 'setPage'
    | 'total'
    | 'loading'
    | 'submitting'
    | 'handleUpdate'
    | 'handleDelete'
  >;
}) {
  const { items, page, setPage, total, loading, submitting, handleUpdate, handleDelete } = model;
  return loading ? (
    <LoadingState />
  ) : items.length === 0 ? (
    <EmptyState />
  ) : (
    <>
      <Card>
        <DataTable
          rows={items}
          rowKey={(unit) => unit.id}
          columns={[
            { key: 'column-0', header: 'ID', cell: (unit) => unit.id },
            {
              key: 'column-1',
              header: 'Название',
              cell: (unit) => (
                <>
                  <TextField.Root
                    form={`unit-${unit.id}`}
                    name="name"
                    defaultValue={unit.name}
                    disabled={Boolean(unit.deleted_at)}
                  />
                </>
              ),
            },
            {
              key: 'column-2',
              header: 'Символ',
              cell: (unit) => (
                <>
                  <TextField.Root
                    form={`unit-${unit.id}`}
                    name="symbol"
                    defaultValue={unit.symbol}
                    disabled={Boolean(unit.deleted_at)}
                  />
                </>
              ),
            },
            {
              key: 'column-3',
              header: 'Статус',
              cell: (unit) =>
                unit.deleted_at ? (
                  <Badge color="gray">Удалена</Badge>
                ) : (
                  <Badge color="green">Активна</Badge>
                ),
            },
            { key: 'column-4', header: 'Обновлено', cell: (unit) => unit.updatedLabel },
            {
              key: 'column-5',
              header: '',
              cell: (unit) => (
                <>
                  <form id={`unit-${unit.id}`} onSubmit={(event) => handleUpdate(unit, event)}>
                    <Flex gap="2">
                      <Button
                        size="2"
                        variant="soft"
                        type="submit"
                        disabled={submitting || Boolean(unit.deleted_at)}
                      >
                        <Save size={15} /> Сохранить
                      </Button>
                      <DeleteButton
                        disabled={submitting || Boolean(unit.deleted_at)}
                        onDelete={() => void handleDelete(unit.id)}
                      />
                    </Flex>
                  </form>
                </>
              ),
            },
          ]}
        />
      </Card>
      <Pagination page={page} size={pageSize} total={total} onPageChange={setPage} />
    </>
  );
}
function IncludeDeleted({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <CheckboxField checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)}>
      Показать удаленные
    </CheckboxField>
  );
}
