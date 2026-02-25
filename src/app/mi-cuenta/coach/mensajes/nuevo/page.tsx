import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-server";
import { startOrGetThread } from "@/lib/conversation-service";

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

function pick(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

export default async function NewCoachMessageThreadPage({ searchParams }: { searchParams: SearchParamsInput }) {
  const sp = await searchParams;
  const coachSlug = pick(sp.coachSlug);
  const coachProfileId = pick(sp.coachProfileId);
  const source = pick(sp.source);
  const returnTo = `/mi-cuenta/coach/mensajes/nuevo?${new URLSearchParams(
    Object.entries({ coachSlug, coachProfileId, source }).filter(([, v]) => typeof v === "string" && v.length > 0) as [string, string][],
  ).toString()}`;

  const user = await requireRole(["coach", "admin"], { returnTo });
  if (user.role !== "coach") notFound();

  if (!coachSlug && !coachProfileId) {
    redirect("/mi-cuenta/coach/mensajes");
  }

  const result = await startOrGetThread({
    user,
    coachSlug,
    coachProfileId,
    source: source || (coachSlug ? `/coaches/${coachSlug}` : "/coaches"),
  });

  if ("error" in result) {
    const msg = encodeURIComponent(result.error);
    redirect(`/mi-cuenta/coach/mensajes?msg_error=${msg}`);
  }

  redirect(`/mi-cuenta/coach/mensajes/${result.thread.id}`);
}
