'use client';

import { Box, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { PackageCheck } from 'lucide-react';
import { LoginForm } from './login-form';
import { useLoginPage } from './use-page';
export function LoginPanel() {
  const model = useLoginPage();
  return (
    <Flex asChild align="center" justify="center" minHeight="100vh" p="5">
      <main>
        <Box width="100%" maxWidth="420px">
          <Card size="4">
            <Flex direction="column" gap="5">
              <Flex align="center" gap="3">
                <Flex align="center" justify="center" width="42px" height="42px">
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
                <Text as="p" size="2" color="gray">
                  Введите логин и пароль, чтобы продолжить работу.
                </Text>
              </Box>

              <LoginForm model={model} />
            </Flex>
          </Card>
        </Box>
      </main>
    </Flex>
  );
}
