'use client';

import { ItemsTable } from './items-table';

import { CatalogNav } from '@/components/catalog-nav';
import { CheckboxField } from '@/components/form-fields';
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

export function PageFilters({
  model,
}: {
  model: Pick<PageModel, 'setPage' | 'onlyProducts' | 'setOnlyProducts'>;
}) {
  const { setPage, onlyProducts, setOnlyProducts } = model;
  return (
    <CheckboxField
      checked={onlyProducts}
      onCheckedChange={(value) => {
        setOnlyProducts(value === true);
        setPage(1);
      }}
    >
      Показать только изделия
    </CheckboxField>
  );
}

export function ItemsList({
  model,
}: {
  model: Pick<PageModel, 'items' | 'page' | 'setPage' | 'total' | 'loading' | 'openItem'>;
}) {
  const { items, page, setPage, total, loading, openItem } = model;
  return loading ? (
    <LoadingState />
  ) : !items.length ? (
    <EmptyState />
  ) : (
    <>
      <Card>
        <ItemsTable items={items} onOpen={openItem} />
      </Card>
      <Pagination page={page} size={pageSize} total={total} onPageChange={setPage} />
    </>
  );
}

export { ItemDialog } from './item-dialog';
