'use client';

import { ItemsTable } from './items-table';

import { CatalogNav } from '@/components/catalog-nav';
import { SelectField } from '@/components/form-fields';
import { ListTools } from '@/components/list-tools';
import {
  EmptyState,
  ErrorNotice,
  LoadingState,
  PageHeader,
  Pagination,
} from '@/components/page-tools';
import { Button, Card } from '@radix-ui/themes';
import { Plus } from 'lucide-react';
import { pageSize } from './model';
import type { PageModel } from './use-page';
export function PageHeading({ model }: { model: Pick<PageModel, 'units' | 'openNew'> }) {
  const { units, openNew } = model;
  return (
    <PageHeader
      title="Номенклатура"
      action={
        <Button onClick={openNew} disabled={!units.length}>
          <Plus size={16} />
          Создать
        </Button>
      }
    />
  );
}

export function PageNavigation() {
  return <CatalogNav />;
}

export function PageError({ model }: { model: Pick<PageModel, 'error'> }) {
  const { error } = model;
  return <ErrorNotice message={error} />;
}

export function PageFilters({ model }: { model: Pick<PageModel, 'query' | 'setQuery' | 'units'> }) {
  const { query, setQuery, units } = model;
  return (
    <ListTools
      query={query}
      onChange={setQuery}
      defaultSort="name_asc"
      placeholder="Название, описание или ID (включая варианты)"
    >
      <SelectField
        label="Изделие"
        value={query.is_product}
        options={[
          { id: 'all', name: 'Все' },
          { id: 'true', name: 'Только изделия' },
          { id: 'false', name: 'Не изделия' },
        ]}
        onChange={(is_product) => setQuery({ ...query, is_product })}
      />
      <SelectField
        label="Единица измерения"
        value={query.unit_id}
        options={[
          { id: 'all', name: 'Все единицы' },
          ...units.map((unit) => ({ id: String(unit.id), name: `${unit.name} (${unit.symbol})` })),
        ]}
        onChange={(unit_id) => setQuery({ ...query, unit_id })}
      />
    </ListTools>
  );
}

export function ItemsList({
  model,
}: {
  model: Pick<PageModel, 'items' | 'page' | 'setPage' | 'total' | 'loading' | 'openItem' | 'query'>;
}) {
  const { items, page, setPage, total, loading, openItem, query } = model;
  return loading ? (
    <LoadingState />
  ) : !items.length ? (
    <EmptyState label="Номенклатура не найдена. Попробуйте изменить условия поиска." />
  ) : (
    <>
      <Card>
        <ItemsTable
          items={items}
          onOpen={openItem}
          expandVariants={
            Boolean(query.search.trim()) || query.is_product !== 'all' || query.unit_id !== 'all'
          }
        />
      </Card>
      <Pagination page={page} size={pageSize} total={total} onPageChange={setPage} />
    </>
  );
}

export { ItemDialog } from './item-dialog';
