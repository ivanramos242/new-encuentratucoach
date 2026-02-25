import Link from "next/link";
import { notFound } from "next/navigation";
import { CoachProfileEditor } from "@/components/coach/coach-profile-editor";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth-server";
import { getCoachProfileForEditorById } from "@/lib/coach-profile-service";

type ParamsInput = Promise<{ coachProfileId: string }>;

export default async function AdminCoachProfileEditorPage({ params }: { params: ParamsInput }) {
  const adminUser = await requireRole("admin", { returnTo: "/admin/coaches" });
  const { coachProfileId } = await params;
  const profile = await getCoachProfileForEditorById(adminUser, coachProfileId);

  if (!profile) notFound();

  return (
    <>
      <PageHero
        badge="Admin"
        title={`Editar coach: ${profile.name}`}
        description="Edicion del perfil publico y de datos internos que no se muestran a clientes."
      />
      <PageShell className="pt-8">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/admin/coaches"
            className="inline-flex rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900"
          >
            Volver a coaches
          </Link>
          {profile.slug ? (
            <Link
              href={`/coaches/${profile.slug}`}
              className="inline-flex rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-900"
              target="_blank"
            >
              Ver ficha publica
            </Link>
          ) : null}
        </div>
        <CoachProfileEditor initialProfile={profile} adminMode targetCoachProfileId={profile.id} />
      </PageShell>
    </>
  );
}
