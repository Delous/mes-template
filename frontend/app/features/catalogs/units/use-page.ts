'use client';
import { deleteCatalogItem } from '@/lib/api';

import { toUnitView, type UnitView } from '@/lib/view-models';
import { toUnitPayload } from './model';

import { createCatalogItem, getCatalog, normalizeApiError, updateCatalogItem } from '@/lib/api';
import type { UnitDto } from '@/types/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { pageSize } from './model';

export function useUnitsPage() {
  const [items, setItems] = useState<UnitView[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCatalog('units', page, pageSize, includeDeleted);
      setItems(response.items.map(toUnitView));
      setTotal(response.total);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [includeDeleted, page]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

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
      await loadItems();
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
