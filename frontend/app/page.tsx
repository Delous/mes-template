'use client';

import { useHomePage } from '@/features/home/use-page';
import { Flex, Spinner, Text } from '@radix-ui/themes';
export default function HomePage() {
  useHomePage();
  return (
    <Flex minHeight="100vh" align="center" justify="center" gap="3">
      <Spinner />
      <Text color="gray">Открываем приложение</Text>
    </Flex>
  );
}
