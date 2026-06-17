import { AppShell } from "@/shared/ui/AppShell";

export default function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
