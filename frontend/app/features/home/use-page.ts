'use client';

import { useAuth } from '@/components/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
export function useHomePage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/tasks');
    }

    if (status === 'anonymous') {
      router.replace('/login');
    }
  }, [router, status]);
}
