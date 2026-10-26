'use client';

import { PageLayout } from '@/components/page-layout';
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
      <OperationTypesTable model={model} />
    </PageLayout>
  );
}
