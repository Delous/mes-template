'use client';

import { useAuth } from '@/components/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { getSafeNextPath, toLoginPayload } from './model';
export function useLoginPage() {
  const { login, status } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get('next'));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(nextPath);
    }
  }, [nextPath, router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      await login(toLoginPayload(formData));
      router.replace(nextPath);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Не удалось войти.');
    } finally {
      setSubmitting(false);
    }
  }

  return { error, submitting, handleSubmit };
}
export type PageModel = ReturnType<typeof useLoginPage>;
