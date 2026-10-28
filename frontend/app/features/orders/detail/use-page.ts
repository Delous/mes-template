'use client';

import { toOrderDetailView, type OrderDetailView } from '@/lib/view-models';

import { useAuth } from '@/components/auth-context';
import { deleteOrder, getAllItems, getOrder, normalizeApiError, updateOrder } from '@/lib/api';
import { toOrderPlanningPayload } from '@/lib/order-planning';
import type { ItemDto } from '@/types/api';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

export function useOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = Number(params.id);
  const [order, setOrder] = useState<OrderDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<ItemDto[]>([]);
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
      setItems(itemResponse);
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

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order || saving) return;
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    try {
      const updated = await updateOrder(order.id, toOrderPlanningPayload(formData));
      setOrder(toOrderDetailView(updated, items));
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setSaving(false);
    }
  }

  return { user, order, loading, deleting, saving, error, handleDelete, handleSave };
}
export type PageModel = ReturnType<typeof useOrderPage>;
