'use client';

import { Box, Button, Callout, Flex, Text, TextField } from '@radix-ui/themes';
import { LockKeyhole, LogIn, User } from 'lucide-react';
import type { PageModel } from './use-page';
export function LoginForm({ model }: { model: PageModel }) {
  const { error, submitting, handleSubmit } = model;
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
          <TextField.Root
            id="password"
            name="password"
            type="password"
            mt="2"
            autoComplete="current-password"
            required
          >
            <TextField.Slot>
              <LockKeyhole size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Box>

        <Button type="submit" size="3" disabled={submitting}>
          <LogIn size={16} />
          {submitting ? 'Входим...' : 'Войти'}
        </Button>
      </Flex>
    </form>
  );
}
