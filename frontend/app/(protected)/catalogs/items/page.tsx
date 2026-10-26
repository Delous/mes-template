'use client';

import { PageLayout } from '@/components/page-layout';
import {
  ItemDialog,
  ItemsList,
  PageError,
  PageFilters,
  PageHeading,
  PageNavigation,
} from '@/features/catalogs/items/sections';
import { useItemsPage } from '@/features/catalogs/items/use-page';

export default function ItemsPage() {
  const model = useItemsPage();
  return (
    <PageLayout>
      <PageHeading model={model} />
      <PageNavigation />
      <PageError model={model} />
      <PageFilters model={model} />
      <ItemsList model={model} />
      <ItemDialog model={model} />
    </PageLayout>
  );
}
