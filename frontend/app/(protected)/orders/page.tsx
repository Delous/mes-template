'use client';

import { PageLayout } from '@/components/page-layout';
import { OrdersTable, PageError, PageHeading } from '@/features/orders/sections';
import { useOrdersPage } from '@/features/orders/use-page';

export default function OrdersPage() {
  const model = useOrdersPage();
  return (
    <PageLayout>
      <PageHeading />
      <PageError model={model} />
      <OrdersTable model={model} />
    </PageLayout>
  );
}
