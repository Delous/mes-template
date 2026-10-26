'use client';

import { toUserView, type UserView } from '@/lib/view-models';
import { toCreateUserPayload, toUpdateUserPayload } from './model';

import {
  createAdminUser,
  getAdminUsers,
  getCatalog,
  normalizeApiError,
  updateAdminUser,
} from '@/lib/api';
import type { WorkstationDto } from '@/types/api';
import { FormEvent, useCallback, useEffect, useState } from 'react';

export function useUsersPage() {
  const [users, setUsers] = useState<UserView[]>([]);
  const [workstations, setWorkstations] = useState<WorkstationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [usersResponse, workstationResponse] = await Promise.all([
        getAdminUsers(),
        getCatalog('workstations', 1, 100),
      ]);
      setUsers(usersResponse.items.map(toUserView));
      setWorkstations(workstationResponse.items);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const user = await createAdminUser(toCreateUserPayload(formData));
      form.reset();
      setCreateFormKey((current) => current + 1);
      setNotice(`Пользователь создан. Логин: ${user.username}`);
      await loadData();
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(userId: number, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    const formData = new FormData(event.currentTarget);

    try {
      await updateAdminUser(userId, toUpdateUserPayload(formData));
      await loadData();
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  return {
    createFormKey,
    users,
    workstations,
    loading,
    submitting,
    error,
    notice,
    handleCreate,
    handleUpdate,
  };
}
export type PageModel = ReturnType<typeof useUsersPage>;
