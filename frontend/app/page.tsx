"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flex, Spinner, Text } from "@radix-ui/themes";

import { useAuth } from "@/components/auth-context";

export default function HomePage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/tasks");
    }

    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [router, status]);

  return (
    <Flex className="route-state" align="center" justify="center" gap="3">
      <Spinner />
      <Text color="gray">Открываем приложение</Text>
    </Flex>
  );
}
