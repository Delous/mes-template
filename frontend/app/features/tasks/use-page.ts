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
    let requestPending = false;
    setLoading(true);
    setError(null);

    const loadTasks = async () => {
      if (!active || requestPending) return;
      requestPending = true;

      try {
        const response = await getTasks(page, pageSize, query);
        if (!active) return;
        setTasks(response.items.map(toTaskView));
        setTotal(response.total);
        setError(null);
      } catch (caughtError) {
        if (active) setError(normalizeApiError(caughtError));
      } finally {
        requestPending = false;
        if (active) setLoading(false);
      }
    };

    const refreshVisibleTasks = () => {
      if (document.visibilityState === 'visible') void loadTasks();
    };

    const timer = setTimeout(() => void loadTasks(), 250);
    const refreshTimer = setInterval(refreshVisibleTasks, 10_000);
    document.addEventListener('visibilitychange', refreshVisibleTasks);

    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', refreshVisibleTasks);
    };
  }, [page, query]);

  return { query, setQuery, tasks, page, setPage, total, loading, error };
}
export type PageModel = ReturnType<typeof useTasksPage>;
