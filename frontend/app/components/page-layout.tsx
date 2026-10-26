import { Container } from '@radix-ui/themes';
import type { ReactNode } from 'react';

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <Container size="4" p={{ initial: '4', md: '6' }}>
      {children}
    </Container>
  );
}
