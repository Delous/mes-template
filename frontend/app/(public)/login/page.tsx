import { LoginPanel } from '@/features/login/sections';
import { Suspense } from 'react';
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPanel />
    </Suspense>
  );
}
