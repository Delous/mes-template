'use client';

import { roleLabels } from '@/lib/view-models';
import { Badge, Box, Button, Card, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { ClipboardList, Database, LogOut, PackageCheck, ShoppingCart, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
const navigation = [
  { href: '/tasks', label: 'Задачи', icon: <ClipboardList size={18} /> },
  { href: '/orders', label: 'Заказы', icon: <ShoppingCart size={18} /> },
  {
    href: '/catalogs/units',
    label: 'Справочники',
    icon: <Database size={18} />,
    activePrefix: '/catalogs',
  },
  { href: '/admin/users', label: 'Пользователи', icon: <Users size={18} />, adminOnly: true },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const visibleNavigation = navigation.filter((item) => !item.adminOnly || user?.role === 'admin');
  const pageTitle =
    visibleNavigation.find((item) => pathname.startsWith(item.href))?.label ?? 'DevIT';
  async function handleLogout() {
    await logout();
    router.replace('/login');
  }
  return (
    <Grid columns={{ initial: '1', md: '272px minmax(0, 1fr)' }} minHeight="100vh">
      <Box
        asChild
        display={{ initial: 'none', md: 'block' }}
        position="sticky"
        top="0"
        height="100vh"
      >
        <aside>
          <Flex direction="column" height="100%" gap="5" p="4">
            <Card>
              <Flex align="center" gap="3">
                <PackageCheck size={20} />
                <Box>
                  <Heading size="4">DevIT</Heading>
                  <Text size="1" color="gray">
                    MES рабочее место
                  </Text>
                </Box>
              </Flex>
            </Card>
            <Flex direction="column" gap="2" flexGrow="1">
              {visibleNavigation.map((item) => {
                const prefix = item.activePrefix ?? item.href;
                const active = pathname === prefix || pathname.startsWith(prefix + '/');
                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={active ? 'solid' : 'soft'}
                    color={active ? undefined : 'gray'}
                  >
                    <Link href={item.href} aria-current={active ? 'page' : undefined}>
                      {item.icon}
                      <Text size="2" weight="medium">
                        {item.label}
                      </Text>
                    </Link>
                  </Button>
                );
              })}
            </Flex>
            <Flex direction="column" gap="3" mt="auto">
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">
                  {user?.full_name}
                </Text>
                {user && (
                  <Badge color={user.role === 'admin' ? 'tomato' : 'gray'}>
                    {roleLabels[user.role]}
                  </Badge>
                )}
              </Flex>
              <Button type="button" variant="soft" color="gray" onClick={handleLogout}>
                <LogOut size={16} />
                Выйти
              </Button>
            </Flex>
          </Flex>
        </aside>
      </Box>
      <Box asChild minWidth="0">
        <main>
          <Box display={{ initial: 'block', md: 'none' }}>
            <Card asChild>
              <header>
                <Flex align="center" justify="between">
                  <Text weight="bold">{pageTitle}</Text>
                  <Button
                    type="button"
                    size="1"
                    variant="soft"
                    color="gray"
                    aria-label="Выйти"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} />
                  </Button>
                </Flex>
              </header>
            </Card>
          </Box>
          {children}
        </main>
      </Box>
    </Grid>
  );
}
