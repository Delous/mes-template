'use client';

import { toOrderPayload } from './model';

import { createOrder, getAllItems, normalizeApiError } from '@/lib/api';
import type { ItemDto } from '@/types/api';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { DraftLine, newLine } from './model';

export function useNewOrderPage() {
  const router = useRouter();
  const [items, setItems] = useState<ItemDto[]>([]);
  const [lines, setLines] = useState<DraftLine[]>([newLine()]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRefs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getAllItems());
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      const order = await createOrder(toOrderPayload(formData, lines));
      router.replace(`/orders/${order.id}`);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  function updateLine(id: number, patch: Partial<DraftLine>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }
  function removeLine(id: number) {
    setLines((current) => current.filter((line) => line.id !== id));
  }
  function addLine() {
    setLines((current) => [...current, newLine()]);
  }
  return {
    updateLine,
    removeLine,
    addLine,
    items,
    lines,
    loading,
    submitting,
    error,
    handleSubmit,
  };
}
export type PageModel = ReturnType<typeof useNewOrderPage>;
