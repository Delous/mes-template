import { AppShell } from "@/components/app-shell";
import { ProtectedRoute } from "@/components/protected-route";

export default function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
