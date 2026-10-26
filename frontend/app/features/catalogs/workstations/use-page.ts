'use client';

import { toNamePayload } from './model';

import { createCatalogItem, getCatalog, normalizeApiError, updateCatalogItem } from '@/lib/api';
import type { WorkstationDto } from '@/types/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { pageSize } from './model';

export function useWorkstationsPage() {
  const [items, setItems] = useState<WorkstationDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCatalog('workstations', page, pageSize);
      setItems(response.items);
      setTotal(response.total);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function run(action: () => Promise<unknown>) {
    setSubmitting(true);
    setError(null);
    try {
      await action();
      await loadItems();
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    await run(async () => {
      await createCatalogItem('workstations', toNamePayload(formData));
      form.reset();
    });
  }

  async function handleUpdate(item: WorkstationDto, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await run(() => updateCatalogItem('workstations', item.id, toNamePayload(formData)));
  }

  return {
    items,
    page,
    setPage,
    total,
    loading,
    submitting,
    error,
    handleCreate,
    handleUpdate,
  };
}
export type PageModel = ReturnType<typeof useWorkstationsPage>;
