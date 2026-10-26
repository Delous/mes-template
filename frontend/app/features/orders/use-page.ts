'use client';

import { toOrderView, type OrderView } from '@/lib/view-models';

import { getOrders, normalizeApiError } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { pageSize } from './model';

export function useOrdersPage() {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getOrders(page, pageSize);
      setOrders(response.items.map(toOrderView));
      setTotal(response.total);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return { orders, page, setPage, total, loading, error };
}
export type PageModel = ReturnType<typeof useOrdersPage>;
