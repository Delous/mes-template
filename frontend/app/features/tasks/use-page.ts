'use client';

import { toTaskView, type TaskView } from '@/lib/view-models';

import { getTasks, normalizeApiError } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { pageSize } from './model';

export function useTasksPage() {
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getTasks(page, pageSize);
      setTasks(response.items.map(toTaskView));
      setTotal(response.total);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  return { tasks, page, setPage, total, loading, error };
}
export type PageModel = ReturnType<typeof useTasksPage>;
