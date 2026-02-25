import { CoachProfileEditor } from "@/components/coach/coach-profile-editor";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth-server";
import { getCoachProfileForEditor } from "@/lib/coach-profile-service";

function pickOne(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function sanitizeReturnToPath(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return undefined;
  if (trimmed.startsWith("//")) return undefined;
  return trimmed;
}

export default async function CoachProfilePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole(["coach", "admin"], { returnTo: "/mi-cuenta/coach/perfil" });
  const profile = await getCoachProfileForEditor(user);
  const params = (await searchParams) || {};
  const wizardParam = pickOne(params.wizard);
  const returnToPath = sanitizeReturnToPath(pickOne(params.returnTo));
  const wizardMode = wizardParam !== "0";

  return (
    <>
      <PageHero
        badge="Mi cuenta · Coach"
        title="Mi perfil coach"
        description="Editor del perfil público: datos, precios, enlaces, galería y publicación."
      />
      <PageShell className="pt-8" containerClassName="w-[94%] xl:w-[80%] max-w-[1600px]">
        <CoachProfileEditor initialProfile={profile} wizardMode={wizardMode} returnToPath={returnToPath} />
      </PageShell>
    </>
  );
}
