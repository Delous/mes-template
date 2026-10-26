'use client';

import { PageLayout } from '@/components/page-layout';
import {
  CreateUnitForm,
  PageError,
  PageFilters,
  PageHeading,
  PageNavigation,
  UnitsTable,
} from '@/features/catalogs/units/sections';
import { useUnitsPage } from '@/features/catalogs/units/use-page';

export default function UnitsPage() {
  const model = useUnitsPage();
  return (
    <PageLayout>
      <PageHeading />
      <PageNavigation />
      <PageError model={model} />
      <PageFilters model={model} />
      <CreateUnitForm model={model} />
      <UnitsTable model={model} />
    </PageLayout>
  );
}
