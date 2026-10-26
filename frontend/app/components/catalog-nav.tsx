'use client';

import { Box, TabNav } from '@radix-ui/themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const links = [
  { href: '/catalogs/units', label: 'Единицы' },
  { href: '/catalogs/items', label: 'Номенклатура' },
  { href: '/catalogs/workstations', label: 'Рабочие посты' },
  { href: '/catalogs/operation-types', label: 'Типы операций' },
];
export function CatalogNav() {
  const pathname = usePathname();
  return (
    <Box overflowX="auto" mb="4">
      <TabNav.Root>
        {links.map((link) => (
          <TabNav.Link key={link.href} asChild active={pathname === link.href}>
            <Link href={link.href}>{link.label}</Link>
          </TabNav.Link>
        ))}
      </TabNav.Root>
    </Box>
  );
}
