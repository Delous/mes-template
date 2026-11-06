'use client';

import { PageLayout } from '@/components/page-layout';
import { canAccessRoute } from '@/lib/route-access';

import { Callout, Flex, Spinner, Text } from '@radix-ui/themes';
import { ShieldAlert } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from './auth-context';

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasAccess = canAccessRoute(user?.role, pathname);

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (status === 'authenticated' && !hasAccess) {
      router.replace('/tasks');
    }
  }, [hasAccess, pathname, router, status]);

  if (status === 'loading' || status === 'anonymous') {
    return (
      <Flex minHeight="100vh" align="center" justify="center" gap="3">
        <Spinner />
        <Text color="gray">Проверяем сессию</Text>
      </Flex>
    );
  }

  if (requireAdmin && user?.role !== 'admin') {
    return (
      <PageLayout>
        <Callout.Root color="red">
          <Callout.Icon>
            <ShieldAlert size={16} />
          </Callout.Icon>
          <Callout.Text>Раздел доступен только администратору.</Callout.Text>
        </Callout.Root>
      </PageLayout>
    );
  }

  if (!hasAccess) return null;

  return children;
}
