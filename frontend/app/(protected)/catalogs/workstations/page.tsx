'use client';

import { PageLayout } from '@/components/page-layout';
import { ListTools } from '@/components/list-tools';
import {
  CreateWorkstationForm,
  PageError,
  PageHeading,
  PageNavigation,
  WorkstationsTable,
} from '@/features/catalogs/workstations/sections';
import { useWorkstationsPage } from '@/features/catalogs/workstations/use-page';

export default function WorkstationsPage() {
  const model = useWorkstationsPage();
  return (
    <PageLayout>
      <PageHeading />
      <PageNavigation />
      <PageError model={model} />
      <CreateWorkstationForm model={model} />
      <ListTools query={model.query} onChange={model.setQuery} />
      <WorkstationsTable model={model} />
    </PageLayout>
  );
}
