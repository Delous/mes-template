'use client';

import * as Collapsible from '@radix-ui/react-collapsible';
import { Box, Button } from '@radix-ui/themes';
import { useState, type ReactNode } from 'react';
export function Disclosure({ title, children }: { title: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
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
