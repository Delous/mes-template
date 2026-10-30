'use client';
import { useListQuery } from '@/lib/use-list-query';
import { deleteCatalogItem } from '@/lib/api';

import { toUnitView, type UnitView } from '@/lib/view-models';
import { toUnitPayload } from './model';

import { createCatalogItem, getCatalog, normalizeApiError, updateCatalogItem } from '@/lib/api';
import type { UnitDto } from '@/types/api';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { pageSize } from './model';

export function useUnitsPage() {
  const [items, setItems] = useState<UnitView[]>([]);
  const { query, setQuery, page, setPage } = useListQuery('id_asc');
  const requestVersion = useRef(0);
  const invalidateRequests = useCallback(() => {
    requestVersion.current++;
  }, []);
  const [total, setTotal] = useState(0);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const response = await getCatalog(
        'units',
        page,
        pageSize,
        includeDeleted,
        false,
        true,
        query,
      );
      if (version !== requestVersion.current) return;
      if (page > 1 && !response.items.length) {
        setPage(Math.max(1, Math.ceil(response.total / pageSize)));
        return;
      }
      setItems(response.items.map(toUnitView));
      setTotal(response.total);
    } catch (caughtError) {
      if (version === requestVersion.current) setError(normalizeApiError(caughtError));
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [includeDeleted, page, query, setPage]);

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

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    await run(async () => {
      await createCatalogItem('units', toUnitPayload(formData));
      form.reset();
    });
  }

  async function handleUpdate(unit: UnitDto, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await run(() => updateCatalogItem('units', unit.id, toUnitPayload(formData)));
  }

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

  function handleDelete(id: number) {
    return run(() => deleteCatalogItem('units', id));
  }
  return {
    handleDelete,
    items,
    query,
    setQuery,
    page,
    setPage,
    total,
    includeDeleted,
    setIncludeDeleted,
    loading,
    submitting,
    error,
    handleCreate,
    handleUpdate,
    run,
  };
}
export type PageModel = ReturnType<typeof useUnitsPage>;
