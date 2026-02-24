import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth-server";

export default async function MyAccountPage() {
  const user = await requireSessionUser({ returnTo: "/mi-cuenta" });
  if (user.role === "admin") {
    redirect("/admin");
  }
  if (user.role === "coach") {
    redirect("/mi-cuenta/coach");
  }
  redirect("/mi-cuenta/cliente");
}

