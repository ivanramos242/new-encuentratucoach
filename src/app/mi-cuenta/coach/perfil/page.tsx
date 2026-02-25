import { CoachProfileEditor } from "@/components/coach/coach-profile-editor";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth-server";
import { getCoachProfileForEditor } from "@/lib/coach-profile-service";

function isActiveish(status?: string | null) {
  return status === "active" || status === "trialing";
}

export default async function CoachProfilePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole(["coach", "admin"], { returnTo: "/mi-cuenta/coach/perfil" });
  const profile = await getCoachProfileForEditor(user);
  const params = (await searchParams) || {};
  const wizardParam = typeof params.wizard === "string" ? params.wizard : undefined;
  const fromCheckout = typeof params.checkout === "string" ? params.checkout === "success" : false;
  const sub = profile?.subscriptions?.[0];
  const wizardMode = wizardParam === "1" || (fromCheckout && isActiveish(sub?.status));

  return (
    <>
      <PageHero
        badge="Mi cuenta · Coach"
        title="Mi perfil coach"
        description="Editor del perfil público: datos, precios, enlaces, galería y publicación."
      />
      <PageShell className="pt-8" containerClassName="w-[94%] xl:w-[80%] max-w-[1600px]">
        <CoachProfileEditor initialProfile={profile} wizardMode={wizardMode} />
      </PageShell>
    </>
  );
}
