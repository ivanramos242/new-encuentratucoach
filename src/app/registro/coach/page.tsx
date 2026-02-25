import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function CoachRegisterPage() {
  redirect("/registro?intent=coach");
}
