"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Callout, Flex, Text, TextField } from "@radix-ui/themes";
import { LockKeyhole, LogIn, User } from "lucide-react";

import { useAuth } from "./auth-context";

function getSafeNextPath(next: string | null) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/tasks";
}

export function LoginForm() {
  const { login, status } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(nextPath);
    }
  }, [nextPath, router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      await login({
        login: String(formData.get("username") ?? "").trim(),
        password: String(formData.get("password") ?? ""),
      });
      router.replace(nextPath);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Не удалось войти.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        {error ? (
          <Callout.Root color="red" size="2">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        ) : null}

        <Box>
          <Text as="label" size="2" weight="medium" htmlFor="username">
            Логин
          </Text>
          <TextField.Root id="username" name="username" mt="2" autoComplete="username" required>
            <TextField.Slot>
              <User size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Box>

        <Box>
          <Text as="label" size="2" weight="medium" htmlFor="password">
            Пароль
          </Text>
          <TextField.Root id="password" name="password" type="password" mt="2" autoComplete="current-password" required>
            <TextField.Slot>
              <LockKeyhole size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Box>

        <Button type="submit" size="3" disabled={submitting}>
          <LogIn size={16} />
          {submitting ? "Входим..." : "Войти"}
        </Button>
      </Flex>
    </form>
  );
}
