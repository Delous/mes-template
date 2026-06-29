"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge, Box, Button, Flex, Heading, Text } from "@radix-ui/themes";
import { ClipboardList, LogOut, PackageCheck, Users, Wrench } from "lucide-react";

import { useAuth } from "./auth-context";
import { PushNotificationStatus } from "./push-notification-status";

type NavigationItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

const navigation: NavigationItem[] = [
  { href: "/tasks", label: "Задачи", icon: <ClipboardList size={18} /> },
  { href: "/admin/users", label: "Пользователи", icon: <Users size={18} />, adminOnly: true },
  { href: "/admin/workstations", label: "Рабочие посты", icon: <Wrench size={18} />, adminOnly: true },
];

const roleLabels = {
  admin: "Администратор",
  operator: "Оператор",
  reviewer: "ОТК",
  storekeeper: "Кладовщик",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const visibleNavigation = navigation.filter((item) => !item.adminOnly || user?.role === "admin");

  const pageTitle = useMemo(() => {
    return visibleNavigation.find((item) => pathname.startsWith(item.href))?.label ?? "DevIT";
  }, [pathname, visibleNavigation]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Flex direction="column" className="app-sidebar-content">
          <Flex align="center" gap="3" className="brand-block">
            <Flex align="center" justify="center" width="36px" height="36px" className="brand-mark">
              <PackageCheck size={20} />
            </Flex>
            <Box className="brand-copy">
              <Heading size="4">DevIT</Heading>
              <Text size="1" color="gray">
                MES рабочее место
              </Text>
            </Box>
          </Flex>

          <Flex direction="column" gap="2" className="nav-list">
            {visibleNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href || pathname.startsWith(`${item.href}/`) ? "active" : ""}`}
              >
                {item.icon}
                <Text size="2" weight="medium">
                  {item.label}
                </Text>
              </Link>
            ))}
          </Flex>

          <Flex direction="column" gap="3" className="sidebar-footer">
            <PushNotificationStatus />
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">
                {user?.full_name}
              </Text>
              {user ? <Badge color={user.role === "admin" ? "tomato" : "gray"}>{roleLabels[user.role]}</Badge> : null}
            </Flex>
            <Button type="button" variant="soft" color="gray" className="logout-button" onClick={handleLogout}>
              <LogOut size={16} />
              Выйти
            </Button>
          </Flex>
        </Flex>
      </aside>

      <main className="app-main">
        <header className="mobile-header">
          <Text weight="bold">{pageTitle}</Text>
          <Flex align="center" gap="2">
            <PushNotificationStatus />
            <Button type="button" size="1" variant="soft" color="gray" onClick={handleLogout}>
              <LogOut size={14} />
            </Button>
          </Flex>
        </header>
        {children}
      </main>
    </div>
  );
}
