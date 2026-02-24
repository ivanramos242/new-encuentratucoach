import { requireRole } from "@/lib/auth-server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin", { returnTo: "/admin" });
  return <>{children}</>;
}

