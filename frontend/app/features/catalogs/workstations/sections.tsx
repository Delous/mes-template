'use client';

import { NameCatalogForm, NameCatalogTable } from '@/components/name-catalog';

import { CatalogNav } from '@/components/catalog-nav';
import {
  EmptyState,
  ErrorNotice,
  LoadingState,
  PageHeader,
  Pagination,
} from '@/components/page-tools';
import { Card } from '@radix-ui/themes';
import { pageSize } from './model';
import type { PageModel } from './use-page';
export function PageHeading() {
  return <PageHeader title="Рабочие посты" />;
}

export function PageNavigation() {
  return <CatalogNav />;
}

export function PageError({ model }: { model: Pick<PageModel, 'error'> }) {
  const { error } = model;
  return <ErrorNotice message={error} />;
}

export function CreateWorkstationForm({
  model,
}: {
  model: Pick<PageModel, 'submitting' | 'handleCreate'>;
}) {
  const { submitting, handleCreate } = model;
  return <NameCatalogForm submitting={submitting} onSubmit={handleCreate} />;
}

export function WorkstationsTable({
  model,
}: {
  model: Pick<
    PageModel,
    'items' | 'page' | 'setPage' | 'total' | 'loading' | 'submitting' | 'handleUpdate'
  >;
}) {
  const { items, page, setPage, total, loading, submitting, handleUpdate } = model;
  return loading ? (
    <LoadingState />
  ) : items.length === 0 ? (
    <EmptyState />
  ) : (
    <>
      <Card>
        <NameCatalogTable
          items={items}
          prefix="workstation"
          submitting={submitting}
          onUpdate={handleUpdate}
        />
      </Card>
      <Pagination page={page} size={pageSize} total={total} onPageChange={setPage} />
    </>
  );
}
