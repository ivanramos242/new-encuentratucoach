import { requireRole } from "@/lib/auth-server";

export default async function CoachAccountLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["coach", "admin"], { returnTo: "/mi-cuenta/coach" });
  return <>{children}</>;
}

