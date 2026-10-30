'use client';

import * as Collapsible from '@radix-ui/react-collapsible';
import { Box, Button } from '@radix-ui/themes';
import { useState, type ReactNode } from 'react';
export function Disclosure({
  title,
  children,
  defaultOpen = false,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} asChild>
      <Box mt="3">
        <Collapsible.Trigger asChild>
          <Button type="button" variant="ghost">
            {title}
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content forceMount asChild>
          <Box mt="3" display={open ? 'block' : 'none'}>
            {children}
          </Box>
        </Collapsible.Content>
      </Box>
    </Collapsible.Root>
  );
}
