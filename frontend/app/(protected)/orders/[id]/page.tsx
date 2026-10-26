'use client';

import { PageLayout } from '@/components/page-layout';
import { OrderDetails, PageError, PageHeading } from '@/features/orders/detail/sections';
import { useOrderPage } from '@/features/orders/detail/use-page';

export default function OrderPage() {
  const model = useOrderPage();
  return (
    <PageLayout>
      <PageHeading model={model} />
      <PageError model={model} />
      <OrderDetails model={model} />
    </PageLayout>
  );
}
