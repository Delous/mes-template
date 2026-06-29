import { ProtectedRoute } from "@/components/protected-route";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ProtectedRoute requireAdmin>{children}</ProtectedRoute>;
}
