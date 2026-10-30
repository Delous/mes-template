'use client';

import { toTaskView, type TaskView } from '@/lib/view-models';

import { getTasks, normalizeApiError } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useListQuery } from '@/lib/use-list-query';
import { pageSize } from './model';

export function useTasksPage() {
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const { query, setQuery, page, setPage } = useListQuery('planning');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const response = await getTasks(page, pageSize, query);
        if (!active) return;
        setTasks(response.items.map(toTaskView));
        setTotal(response.total);
      } catch (caughtError) {
        if (active) setError(normalizeApiError(caughtError));
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [page, query]);

  return { query, setQuery, tasks, page, setPage, total, loading, error };
}
export type PageModel = ReturnType<typeof useTasksPage>;
