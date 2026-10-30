'use client';
import { useListQuery } from '@/lib/use-list-query';

import { toNamePayload } from './model';

import { createCatalogItem, getCatalog, normalizeApiError, updateCatalogItem } from '@/lib/api';
import type { WorkstationDto } from '@/types/api';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { pageSize } from './model';

export function useWorkstationsPage() {
  const [items, setItems] = useState<WorkstationDto[]>([]);
  const { query, setQuery, page, setPage } = useListQuery('id_asc');
  const requestVersion = useRef(0);
  const invalidateRequests = useCallback(() => {
    requestVersion.current++;
  }, []);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const response = await getCatalog('workstations', page, pageSize, false, false, true, query);
      if (version !== requestVersion.current) return;
      if (page > 1 && !response.items.length) {
        setPage(Math.max(1, Math.ceil(response.total / pageSize)));
        return;
      }
      setItems(response.items);
      setTotal(response.total);
    } catch (caughtError) {
      if (version === requestVersion.current) setError(normalizeApiError(caughtError));
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [page, query, setPage]);

  const reload = useRef(loadItems);
  useEffect(() => {
    reload.current = loadItems;
  }, [loadItems]);
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      void loadItems();
    }, 250);
    return () => {
      clearTimeout(timer);
      invalidateRequests();
    };
  }, [loadItems, invalidateRequests]);

  async function run(action: () => Promise<unknown>) {
    setSubmitting(true);
    setError(null);
    try {
      await action();
      await reload.current();
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
    query,
    setQuery,
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
