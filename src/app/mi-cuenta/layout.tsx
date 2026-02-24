import { requireSessionUser } from "@/lib/auth-server";

export default async function MyAccountLayout({ children }: { children: React.ReactNode }) {
  await requireSessionUser({ returnTo: "/mi-cuenta" });
  return <>{children}</>;
}

