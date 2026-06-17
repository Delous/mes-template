"use client";

import { useActionState } from "react";
import { Box, Button, Callout, Flex, Text, TextField } from "@radix-ui/themes";
import { LockKeyhole, LogIn, User } from "lucide-react";

import { labels } from "@/shared/i18n/labels";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ nextPath = "/tasks" }: { nextPath?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction}>
      <Flex direction="column" gap="4">
        <input type="hidden" name="next" value={nextPath} />

        {state.error ? (
          <Callout.Root color="red" size="2">
            <Callout.Text>{state.error}</Callout.Text>
          </Callout.Root>
        ) : null}

        <Box>
          <Text as="label" size="2" weight="medium" htmlFor="username">
            {labels.fields.username}
          </Text>
          <TextField.Root id="username" name="username" mt="2" autoComplete="username" required>
            <TextField.Slot>
              <User size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Box>

        <Box>
          <Text as="label" size="2" weight="medium" htmlFor="password">
            {labels.fields.password}
          </Text>
          <TextField.Root id="password" name="password" type="password" mt="2" autoComplete="current-password" required>
            <TextField.Slot>
              <LockKeyhole size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Box>

        <Button type="submit" size="3" disabled={pending}>
          <LogIn size={16} />
          {pending ? labels.auth.signingIn : labels.auth.signIn}
        </Button>
      </Flex>
    </form>
  );
}
