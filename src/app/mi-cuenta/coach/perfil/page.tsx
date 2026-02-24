import { CoachProfileEditor } from "@/components/coach/coach-profile-editor";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth-server";
import { getCoachProfileForEditor } from "@/lib/coach-profile-service";

export default async function CoachProfilePage() {
  const user = await requireRole(["coach", "admin"], { returnTo: "/mi-cuenta/coach/perfil" });
  const profile = await getCoachProfileForEditor(user);

  return (
    <>
      <PageHero
        badge="Mi cuenta · Coach"
        title="Mi perfil coach"
        description="Editor del perfil público: datos, precios, enlaces, galería y publicación."
      />
      <PageShell className="pt-8">
        <CoachProfileEditor initialProfile={profile} />
      </PageShell>
    </>
  );
}

