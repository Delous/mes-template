"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Button, Flex, Heading, IconButton, Text } from "@radix-ui/themes";
import { ClipboardList, Database, LogOut, Menu, PackageCheck, ShoppingCart, Users } from "lucide-react";

import { logoutAction } from "@/features/auth/actions";
import { labels } from "@/shared/i18n/labels";
import { navigation, type NavigationItem } from "@/shared/navigation/navigation";

import { MobileNavigationDrawer } from "./MobileNavigationDrawer";

const icons: Record<string, React.ReactNode> = {
  tasks: <ClipboardList size={18} />,
  orders: <ShoppingCart size={18} />,
  catalogs: <Database size={18} />,
  users: <Users size={18} />,
};

function isActive(pathname: string, item: NavigationItem): boolean {
  if (item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))) return true;
  return item.children?.some((child) => isActive(pathname, child)) ?? false;
}

export function NavigationList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <Flex direction="column" gap="2" className="nav-list">
      {navigation.map((item) => (
        <Box key={item.key}>
          {item.href ? (
            <Link
              href={item.href}
              onClick={onNavigate}
              className={`nav-link ${isActive(pathname, item) ? "active" : ""}`}
            >
              {icons[item.key]}
              <Text size="2" weight="medium">
                {item.label}
              </Text>
            </Link>
          ) : (
            <Flex align="center" gap="2" className="nav-group-label">
              {icons[item.key]}
              <Text size="2" weight="bold" color="gray">
                {item.label}
              </Text>
            </Flex>
          )}

          {item.children ? (
            <Flex direction="column" gap="1" className="nav-children">
              {item.children.map((child) => (
                <Link
                  key={child.key}
                  href={child.href ?? "#"}
                  onClick={onNavigate}
                  className={`nav-link child ${isActive(pathname, child) ? "active" : ""}`}
                >
                  <Text size="2">{child.label}</Text>
                </Link>
              ))}
            </Flex>
          ) : null}
        </Box>
      ))}
    </Flex>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const currentPageLabel = useMemo(() => {
    const flat = navigation.flatMap((item) => [item, ...(item.children ?? [])]);
    return flat.find((item) => item.href && pathname.startsWith(item.href))?.label ?? labels.app.name;
  }, [pathname]);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Flex direction="column" className="app-sidebar-content">
          <Flex align="center" gap="3" className="brand-block">
            <Flex align="center" justify="center" width="36px" height="36px" className="brand-mark">
              <PackageCheck size={20} />
            </Flex>
            <Box className="brand-copy">
              <Heading size="4">{labels.app.name}</Heading>
              <Text size="1" color="gray">
                {labels.app.subtitle}
              </Text>
            </Box>
          </Flex>
          <NavigationList />
          <form action={logoutAction} className="logout-form">
            <Button type="submit" variant="soft" color="gray" className="logout-button">
              <LogOut size={16} />
              {labels.auth.signedOut}
            </Button>
          </form>
        </Flex>
      </aside>

      <main className="app-main">
        <header className="mobile-header">
          <IconButton variant="soft" color="gray" aria-label="Открыть меню" onClick={() => setOpen(true)}>
            <Menu size={18} />
          </IconButton>
          <Text weight="bold">{currentPageLabel}</Text>
        </header>
        <MobileNavigationDrawer open={open} onOpenChange={setOpen} />
        {children}
      </main>
    </div>
  );
}
