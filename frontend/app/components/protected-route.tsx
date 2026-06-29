"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Callout, Flex, Spinner, Text } from "@radix-ui/themes";
import { ShieldAlert } from "lucide-react";

import { useAuth } from "./auth-context";

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

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, status]);

  if (status === "loading" || status === "anonymous") {
    return (
      <Flex className="route-state" align="center" justify="center" gap="3">
        <Spinner />
        <Text color="gray">Проверяем сессию</Text>
      </Flex>
    );
  }

  if (requireAdmin && user?.role !== "admin") {
    return (
      <Box className="page-content">
        <Callout.Root color="red">
          <Callout.Icon>
            <ShieldAlert size={16} />
          </Callout.Icon>
          <Callout.Text>Раздел доступен только администратору.</Callout.Text>
        </Callout.Root>
      </Box>
    );
  }

  return children;
}
