'use client';

import { toOrderDetailView, type OrderDetailView } from '@/lib/view-models';

import { useAuth } from '@/components/auth-context';
import { deleteOrder, getAllItems, getOrder, normalizeApiError } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export function useOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = Number(params.id);
  const [order, setOrder] = useState<OrderDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [orderResponse, itemResponse] = await Promise.all([
        getOrder(orderId),
        getAllItems(false),
      ]);
      setOrder(toOrderDetailView(orderResponse, itemResponse));
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  async function handleDelete() {
    if (!order) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteOrder(order.id);
      router.replace('/orders');
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
      setDeleting(false);
    }
  }

  return { user, order, loading, deleting, error, handleDelete };
}
export type PageModel = ReturnType<typeof useOrderPage>;
