import { requireRole } from "@/lib/auth-server";

export default async function ClientAccountLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["client", "admin"], { returnTo: "/mi-cuenta/cliente" });
  return <>{children}</>;
}

