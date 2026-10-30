'use client';

import { PageLayout } from '@/components/page-layout';
import { ListTools } from '@/components/list-tools';
import {
  CreateOperationTypeForm,
  OperationTypesTable,
  PageError,
  PageHeading,
  PageNavigation,
} from '@/features/catalogs/operation-types/sections';
import { useOperationTypesPage } from '@/features/catalogs/operation-types/use-page';

export default function OperationTypesPage() {
  const model = useOperationTypesPage();
  return (
    <PageLayout>
      <PageHeading />
      <PageNavigation />
      <PageError model={model} />
      <CreateOperationTypeForm model={model} />
      <ListTools query={model.query} onChange={model.setQuery} />
      <OperationTypesTable model={model} />
    </PageLayout>
  );
}
