'use client';

import { toTaskView, type TaskView } from '@/lib/view-models';
import { toTaskPayload } from './model';

import { useAuth } from '@/components/auth-context';
import { getTask, normalizeApiError, updateTask } from '@/lib/api';
import type { TaskUpdateStatus } from '@/types/api';
import { useParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';

export function useTaskPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const taskId = Number(params.id);
  const [task, setTask] = useState<TaskView | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTask = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setTask(toTaskView(await getTask(taskId)));
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  async function handleTransition(status: TaskUpdateStatus, event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!task) return;

    const formData = event ? new FormData(event.currentTarget) : new FormData();
    if (user?.role === 'operator' && task.task_type === 'operation' && status === 'done') {
      formData.set('actual_quantity_delta', task.planned_quantity);
    }
    setSubmitting(true);
    setError(null);

    try {
      const updatedTask = await updateTask(task.id, toTaskPayload(status, formData));
      setTask(toTaskView(updatedTask));
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  return { user, task, loading, submitting, error, handleTransition };
}
export type PageModel = ReturnType<typeof useTaskPage>;
