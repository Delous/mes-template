"use client";

import { Suspense } from "react";
import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { PackageCheck } from "lucide-react";

import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-panel surface">
        <Flex direction="column" gap="5">
          <Flex align="center" gap="3">
            <Flex align="center" justify="center" width="42px" height="42px" className="brand-mark">
              <PackageCheck size={22} />
            </Flex>
            <Box>
              <Heading size="6">DevIT</Heading>
              <Text size="2" color="gray">
                Вход в MES
              </Text>
            </Box>
          </Flex>

          <Box>
            <Heading size="5" mb="2">
              Вход
            </Heading>
            <Text as="p" size="2" color="gray" className="login-copy">
              Введите логин и пароль, чтобы продолжить работу.
            </Text>
          </Box>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </Flex>
      </section>
    </main>
  );
}
