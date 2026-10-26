import { Box, Text } from '@radix-ui/themes';
import type { ReactNode } from 'react';

export function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box>
      <Text size="1" color="gray">
        {label}
      </Text>
      <Text as="div" weight="medium">
        {value}
      </Text>
    </Box>
  );
}
