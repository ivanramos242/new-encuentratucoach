import Link from "next/link";
import { faArrowRight, faCertificate } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CoachCertificationRequestForm } from "@/components/coach/coach-certification-request-form";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth-server";
import { getCoachProfileForEditor } from "@/lib/coach-profile-service";
import { prisma } from "@/lib/prisma";

export default async function Page() {
  const user = await requireRole(["coach", "admin"], { returnTo: "/mi-cuenta/coach/certificacion" });
  const profile = await getCoachProfileForEditor(user);

  if (!profile) {
    return (
      <>
        <PageHero
          badge="Mi cuenta · Coach"
          title="Certificación"
          description="Sube documentación para solicitar el distintivo de coach certificado."
        />
        <PageShell className="pt-8">
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-700">
              Primero necesitas tener un perfil de coach vinculado para solicitar la certificación.
            </p>
            <Link
              href="/mi-cuenta/coach/perfil"
              className="mt-4 inline-flex items-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Ir a perfil coach
              <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3.5 w-3.5" />
            </Link>
          </div>
        </PageShell>
      </>
    );
  }

  const latestRequest = await prisma.certificationRequest.findFirst({
    where: { coachProfileId: profile.id },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      status: true,
      submittedAt: true,
      reviewedAt: true,
      reviewerNotes: true,
    },
  });

  const phone = profile.links.find((link) => link.type === "phone")?.value ?? null;
  const website = profile.links.find((link) => link.type === "web")?.value ?? null;
  const locationLabel = [profile.location?.city, profile.location?.province, profile.location?.country].filter(Boolean).join(", ") || null;
  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  const profileUrl = profile.slug && siteBase ? `${siteBase}/coaches/${profile.slug}` : null;

  return (
    <>
      <PageHero
        badge="Mi cuenta · Coach"
        title="Certificación"
        description="Solicita el distintivo de coach certificado subiendo documentación (fotos o PDF). Revisión manual en 5-14 días."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6">
          <section className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
            <div className="grid gap-5 bg-[radial-gradient(circle_at_12%_0%,rgba(251,191,36,.15),transparent_42%),radial-gradient(circle_at_100%_15%,rgba(6,182,212,.14),transparent_40%)] p-6 lg:grid-cols-[1.1fr_.9fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
                  <FontAwesomeIcon icon={faCertificate} className="h-3.5 w-3.5" />
                  Revisión documental
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">Solicita tu certificación</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  Sube certificados o acreditaciones para que el equipo de EncuentraTuCoach los revise. Al enviar la
                  solicitud se notificará por email a <strong>info@encuentratucoach.es</strong>.
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Plazo estimado</p>
                <p className="mt-1 text-2xl font-black tracking-tight text-zinc-950">5-14 días</p>
                <p className="mt-2 text-sm text-zinc-700">
                  Tras la revisión, se decidirá si el perfil es apto para el distintivo de certificación.
                </p>
              </div>
            </div>
          </section>

          <CoachCertificationRequestForm
            coachName={profile.name || user.displayName || "Coach"}
            coachEmail={profile.owner?.email || user.email}
            profileUrl={profileUrl}
            locationLabel={locationLabel}
            phone={phone}
            website={website}
            certifiedStatus={profile.certifiedStatus}
            latestRequest={
              latestRequest
                ? {
                    id: latestRequest.id,
                    status: latestRequest.status,
                    submittedAt: latestRequest.submittedAt.toISOString(),
                    reviewedAt: latestRequest.reviewedAt?.toISOString() ?? null,
                    reviewerNotes: latestRequest.reviewerNotes,
                  }
                : null
            }
          />
        </div>
      </PageShell>
    </>
  );
}
