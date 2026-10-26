'use client';

import { PageLayout } from '@/components/page-layout';
import { CreateOrderForm, PageError, PageHeading } from '@/features/orders/create/sections';
import { useNewOrderPage } from '@/features/orders/create/use-page';

export default function NewOrderPage() {
  const model = useNewOrderPage();
  return (
    <PageLayout>
      <PageHeading />
      <PageError model={model} />
      <CreateOrderForm model={model} />
    </PageLayout>
  );
}
