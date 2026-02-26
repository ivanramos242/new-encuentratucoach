import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  faArrowTrendDown,
  faArrowTrendUp,
  faChartColumn,
  faCirclePlay,
  faClock,
  faEnvelope,
  faEuroSign,
  faGlobe,
  faImages,
  faLanguage,
  faLocationDot,
  faPenToSquare,
  faPhone,
  faStar,
  faTag,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProfileAnalyticsTracker } from "@/components/analytics/profile-analytics-tracker";
import { ProfileClickLink } from "@/components/analytics/profile-click-link";
import { CoachGalleryLightbox } from "@/components/coach/coach-gallery-lightbox";
import { CoachMessageBottomCta } from "@/components/coach/coach-message-bottom-cta";
import { CoachProfileActionPopups } from "@/components/coach/coach-profile-action-popups";
import { CoachReviewForm } from "@/components/coach/coach-review-form";
import { CoachProfileSectionNav } from "@/components/coach/coach-profile-section-nav";
import { CoachCard } from "@/components/directory/coach-card";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getOptionalSessionUser } from "@/lib/auth-server";
import { getCoachPrivateAnalyticsSummary, type CoachPrivateAnalyticsSummary } from "@/lib/coach-profile-analytics";
import { getCoachCategoryLabel } from "@/lib/coach-category-catalog";
import { getCoachAverageRating, getRelatedCoachesFrom } from "@/lib/directory";
import { getPublicCoachBySlugMerged, listPublicCoachesMerged } from "@/lib/public-coaches";
import { buildMetadata } from "@/lib/seo";
import { formatEuro } from "@/lib/utils";

type ParamsInput = Promise<{ coachSlug: string }>;
type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

function normalizePhoneForWhatsapp(value?: string | null) {
  if (!value) return "";
  let digits = value.replace(/\D+/g, "");
  if (!digits) return "";
  if (!digits.startsWith("34")) digits = `34${digits}`;
  return digits;
}

function buildCoachWhatsappHref(rawPhone: string, coachName: string) {
  const phone = normalizePhoneForWhatsapp(rawPhone);
  if (!phone) return "";
  const text = `Hola ${coachName}, te he visto en encuentratucoach.es y estoy interesado en tus servicios.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: ParamsInput;
  searchParams: SearchParamsInput;
}): Promise<Metadata> {
  const { coachSlug } = await params;
  const sp = await searchParams;
  const coach = await getPublicCoachBySlugMerged(coachSlug);
  if (!coach) return buildMetadata({ title: "Coach no encontrado", description: "Perfil no encontrado", noindex: true });

  const hasPopupVariant = sp.etc_popup != null || sp.etc_mail != null || sp.etc_err != null;
  const categoryLabels = coach.categories.map((slug) => getCoachCategoryLabel(slug) ?? slug).filter(Boolean);
  const primaryCategory = categoryLabels[0]?.trim();
  const cityMain = coach.cityLabel.split(",")[0]?.trim();
  const seoTitle =
    primaryCategory && cityMain
      ? `Coach de ${primaryCategory.toLowerCase()} en ${cityMain.toLowerCase()} - ${coach.name}`
      : `${coach.name} - ${coach.cityLabel}`;
  const seoDescription = [
    primaryCategory ? `Coach de ${primaryCategory} en ${coach.cityLabel}.` : "",
    coach.headline || "",
    coach.sessionModes.length ? `Sesiones ${coach.sessionModes.join(" y ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const keywords = [
    coach.name,
    primaryCategory ? `coach de ${primaryCategory} en ${cityMain ?? coach.cityLabel}` : "",
    primaryCategory ? `${primaryCategory} ${coach.cityLabel}` : "",
    cityMain ? `coach en ${cityMain}` : "",
    `coach ${coach.cityLabel}`,
  ].filter(Boolean);

  return buildMetadata({
    title: seoTitle,
    description: seoDescription || coach.headline || `Perfil de coach en ${coach.cityLabel}`,
    path: `/coaches/${coach.slug}`,
    noindex: hasPopupVariant,
    keywords,
  });
}

export default async function CoachProfilePage({ params }: { params: ParamsInput }) {
  const { coachSlug } = await params;
  const coach = await getPublicCoachBySlugMerged(coachSlug);
  if (!coach) notFound();

  const sessionUser = await getOptionalSessionUser();
  const isOwnCoachProfile = sessionUser?.role === "coach" && sessionUser.coachProfileId === coach.id;
  const canSeeCoachStats =
    sessionUser?.role === "admin" || isOwnCoachProfile;
  const privateStats = canSeeCoachStats ? await getCoachPrivateAnalyticsSummary(coach.id) : null;

  const rating = getCoachAverageRating(coach);
  const visibleReviews = coach.reviews;
  const related = getRelatedCoachesFrom(await listPublicCoachesMerged(), coach, 3);
  const categoryLabels = coach.categories.map((slug) => getCoachCategoryLabel(slug) ?? slug);
  const categoryNames = categoryLabels.join(", ");

  const coachUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/coaches/${coach.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/` },
          { "@type": "ListItem", position: 2, name: "Coaches", item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/coaches` },
          { "@type": "ListItem", position: 3, name: coach.name, item: coachUrl },
        ],
      },
      {
        "@type": "ProfessionalService",
        name: coach.name,
        areaServed: "Spain",
        description: coach.bio,
        image: coach.heroImageUrl,
        url: coachUrl,
        address: {
          "@type": "PostalAddress",
          addressLocality: coach.cityLabel.split(",")[0],
          addressCountry: "ES",
        },
        sameAs: [coach.links.web, coach.links.linkedin, coach.links.instagram, coach.links.facebook].filter(Boolean),
        telephone: coach.links.phone,
        email: coach.links.email,
        knowsLanguage: coach.languages.length ? coach.languages : undefined,
        makesOffer:
          coach.basePriceEur > 0
            ? {
                "@type": "Offer",
                priceCurrency: "EUR",
                price: coach.basePriceEur,
              }
            : undefined,
        aggregateRating:
          rating > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: Number(rating.toFixed(1)),
                reviewCount: visibleReviews.length,
              }
            : undefined,
      },
    ],
  };

  const leadBits = [
    categoryNames ? `Coaching de ${categoryNames}` : "",
    coach.cityLabel ? `en ${coach.cityLabel}` : "",
    coach.sessionModes.length ? `con sesiones ${coach.sessionModes.join(" y ")}` : "",
    coach.languages.length ? `en ${coach.languages.join(", ")}` : "",
  ].filter(Boolean);

  return (
    <>
      <ProfileAnalyticsTracker coachId={coach.id} />
      <JsonLd data={jsonLd} />

      <PageShell className="pb-28 pt-6 sm:pb-32">
        <section id="inicio" className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
          <div className="grid gap-6 bg-[radial-gradient(circle_at_8%_0%,rgba(6,182,212,.10),transparent_38%),radial-gradient(circle_at_98%_10%,rgba(16,185,129,.10),transparent_36%)] p-5 sm:p-6 xl:grid-cols-[1.15fr_.85fr] xl:p-8">
            <div>
              <div className="flex items-center justify-between gap-3">
                <Link
                  href="/coaches"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white/90 text-zinc-900"
                  aria-label="Volver al directorio"
                >
                  <HeroIcon name="back" />
                </Link>
                <div className="flex items-center gap-2">
                  {isOwnCoachProfile ? (
                    <Link
                      href={`/mi-cuenta/coach/perfil?${new URLSearchParams({ returnTo: `/coaches/${coach.slug}` }).toString()}`}
                      className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300 bg-cyan-50 px-3 py-2.5 text-sm font-semibold text-cyan-900 hover:bg-cyan-100"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4" />
                      Editar perfil
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    data-etc-open-popup="share"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white/90 text-zinc-900"
                    aria-label="Compartir perfil"
                  >
                    <HeroIcon name="share" />
                  </button>
                </div>
              </div>

              <p className="mt-4 text-sm font-semibold text-zinc-600">Encuentra • coach en España • online o presencial</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">{coach.name}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-700">{leadBits.join(" · ") || coach.headline}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {categoryLabels.map((label, index) => (
                  <span key={`${label}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-800">
                    <FontAwesomeIcon icon={faTag} className="h-3.5 w-3.5 text-zinc-500" />
                    {label}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {coach.certifiedStatus === "approved" ? <Chip tone="success" icon={faStar}>Coach certificado</Chip> : null}
                {coach.sessionModes.map((mode) => (
                  <Chip key={mode} icon={mode === "online" ? faGlobe : faUsers}>{mode === "online" ? "Sesión Online" : "Sesión Presencial"}</Chip>
                ))}
                <Chip icon={faLocationDot}>{coach.cityLabel}</Chip>
                {coach.languages.length ? <Chip icon={faLanguage}>{coach.languages.join(" y ")}</Chip> : null}
                <Chip icon={faEuroSign}>{coach.basePriceEur ? `Desde ${formatEuro(coach.basePriceEur)} · sesión` : "Precio a consultar"}</Chip>
              </div>

              <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-3xl font-black tracking-tight text-zinc-900">
                    {rating > 0 ? rating.toFixed(1).replace(".", ",") : "Sin reseñas"}
                  </div>
                  {rating > 0 ? <div className="text-xl text-amber-500">★★★★★</div> : null}
                </div>
                <p className="mt-1 text-sm text-zinc-700">
                  {visibleReviews.length
                    ? `${rating.toFixed(1).replace(".", ",")} de 5 estrellas (basado en ${visibleReviews.length} reseña${visibleReviews.length > 1 ? "s" : ""})`
                    : "Este perfil todavia no tiene reseñas"}
                </p>
              </div>

              <CoachProfileActionPopups coach={{ id: coach.id, name: coach.name, heroImageUrl: coach.heroImageUrl, headline: coach.headline, links: coach.links }} />

              <p className="mt-3 text-sm text-zinc-600">
                <Link href="/pregunta-a-un-coach" className="font-semibold text-cyan-700 hover:text-cyan-800">¿Tienes dudas? Pregunta a un coach</Link>
                <span> · </span>
                <Link href="/coaches" className="font-semibold text-cyan-700 hover:text-cyan-800">Ver más coaches</Link>
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-zinc-100">
                <div className="relative aspect-[16/10]">
                  <Image src={coach.heroImageUrl} alt={`Imagen de ${coach.name}`} fill className="object-cover" priority sizes="(max-width: 1279px) 100vw, 40vw" />
                </div>
                <div className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-black/35 text-white">
                  <HeroIcon name="zoom" />
                </div>
              </div>

              <div className="rounded-3xl border border-black/10 bg-white p-4">
                <h2 className="text-lg font-black tracking-tight text-zinc-950">
                  <FontAwesomeIcon icon={faGlobe} className="mr-2 h-4 w-4 text-zinc-500" />
                  Redes y contacto rápido
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {coach.links.whatsapp ? (
                    <ContactLink coachId={coach.id} coachName={coach.name} target="whatsapp" href={coach.links.whatsapp} label="WhatsApp" />
                  ) : null}
                  {coach.links.phone ? <ContactLink coachId={coach.id} coachName={coach.name} target="phone" href={`tel:${coach.links.phone}`} label="Llamar" /> : null}
                  {coach.links.web ? <ContactLink coachId={coach.id} coachName={coach.name} target="web" href={coach.links.web} label="Web" external /> : null}
                  {coach.links.instagram ? <ContactLink coachId={coach.id} coachName={coach.name} target="instagram" href={coach.links.instagram} label="Instagram" external /> : null}
                  {coach.links.linkedin ? <ContactLink coachId={coach.id} coachName={coach.name} target="linkedin" href={coach.links.linkedin} label="LinkedIn" external /> : null}
                  {coach.links.facebook ? <ContactLink coachId={coach.id} coachName={coach.name} target="facebook" href={coach.links.facebook} label="Facebook" external /> : null}
                </div>
              </div>

              {coach.videoPresentationUrl ? (
                <div className="rounded-3xl border border-black/10 bg-white p-4">
                  <h2 className="text-lg font-black tracking-tight text-zinc-950">
                    <FontAwesomeIcon icon={faCirclePlay} className="mr-2 h-4 w-4 text-zinc-500" />
                    Video de presentación
                  </h2>
                  <p className="mt-2 text-sm text-zinc-700">Conoce al coach en un video corto antes de contactarle.</p>
                  <a
                    href="#video-presentacion"
                    className="mt-3 inline-flex items-center rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-900"
                  >
                    <FontAwesomeIcon icon={faCirclePlay} className="mr-2 h-4 w-4" />
                    Ver video presentacion
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <CoachProfileSectionNav
          sections={[
            { id: "inicio", label: "Inicio" },
            { id: "sobre-mi", label: "Sobre mí" },
            { id: "galeria", label: "Galería" },
            ...(coach.videoPresentationUrl ? [{ id: "video-presentacion", label: "Vídeo" }] : []),
            { id: "precios", label: "Precios" },
            { id: "resenas", label: "Reseñas" },
          ]}
        />

        <div className="mt-4 space-y-6">
          <section id="sobre-mi" className="scroll-mt-[calc(var(--site-header-offset,96px)+5rem)] rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">
              <FontAwesomeIcon icon={faUser} className="mr-2 h-5 w-5 text-zinc-500" />
              Sobre mi
            </h2>
            <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
              <div>
                {coach.aboutHtml ? (
                  <div className="prose prose-zinc max-w-none prose-a:text-cyan-700" dangerouslySetInnerHTML={{ __html: coach.aboutHtml }} />
                ) : (
                  <p className="leading-7 text-zinc-700">{coach.bio}</p>
                )}
              </div>
              <div className="space-y-3">
                <InfoCard title="Primer paso recomendado" text="Mi objetivo es X. Ahora mismo estoy en Y. Mi mayor bloqueo es Z. ¿Cómo lo trabajaríamos?" />
                <InfoCard title="Precio y condiciones" text={coach.basePriceEur ? `Desde ${formatEuro(coach.basePriceEur)} por sesión. Ver detalles en precios.` : "Consulta el precio y formato en la sección de precios."} />
                {coach.specialties.length ? <InfoCard title="Especialidades" text={coach.specialties.join(", ")} /> : null}
              </div>
            </div>
          </section>

          <section id="galeria" className="scroll-mt-[calc(var(--site-header-offset,96px)+5rem)] rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">
              <FontAwesomeIcon icon={faImages} className="mr-2 h-5 w-5 text-zinc-500" />
              Galería
            </h2>
            <CoachGalleryLightbox coachName={coach.name} heroImageUrl={coach.heroImageUrl} galleryImageUrls={coach.galleryImageUrls} />
          </section>

          {coach.videoPresentationUrl ? (
            <section
              id="video-presentacion"
              className="scroll-mt-[calc(var(--site-header-offset,96px)+5rem)] rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black tracking-tight text-zinc-950">
                  <FontAwesomeIcon icon={faCirclePlay} className="mr-2 h-5 w-5 text-zinc-500" />
                  Video de presentación
                </h2>
                <a
                  href={coach.videoPresentationUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center rounded-xl border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900"
                >
                  <FontAwesomeIcon icon={faCirclePlay} className="mr-2 h-4 w-4 text-zinc-500" />
                  Abrir en otra pestaña
                </a>
              </div>
              <p className="mt-2 text-sm text-zinc-700">
                Si tu navegador no reproduce el video, usa el botón para abrirlo directamente.
              </p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-black">
                <video src={coach.videoPresentationUrl} controls className="aspect-video w-full bg-black" preload="metadata" />
              </div>
            </section>
          ) : null}

          <section id="precios" className="scroll-mt-[calc(var(--site-header-offset,96px)+5rem)] rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">
              <FontAwesomeIcon icon={faEuroSign} className="mr-2 h-5 w-5 text-zinc-500" />
              Precios
            </h2>
            <div className="mt-4">
              <p className="text-4xl font-black tracking-tight text-zinc-900">
                {coach.basePriceEur ? formatEuro(coach.basePriceEur) : "Consultar"}
                <span className="ml-2 text-lg font-semibold text-zinc-500">precio orientativo por sesión</span>
              </p>
            </div>
            <div className="my-4 h-px bg-black/10" />
            {coach.pricingDetails.length ? (
              <div className="space-y-2 text-sm leading-6 text-zinc-700">
                {coach.pricingDetails.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-700">Contacta con el coach para confirmar importe, modalidad y duración.</p>
            )}
            <div className="my-4 h-px bg-black/10" />
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniCard icon={faGlobe} title="Modalidad" value={coach.sessionModes.join(" · ") || "A consultar"} />
              <MiniCard icon={faLocationDot} title="Ubicación" value={coach.cityLabel} />
            </div>
          </section>

          <section id="resenas" className="scroll-mt-[calc(var(--site-header-offset,96px)+5rem)] rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">
              <FontAwesomeIcon icon={faStar} className="mr-2 h-5 w-5 text-zinc-500" />
              Reseñas
            </h2>
            <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-3xl font-black tracking-tight text-zinc-900">
                    {rating > 0 ? rating.toFixed(1).replace(".", ",") : "Sin reseñas"}
                  </div>
                  {rating > 0 ? <div className="text-xl text-amber-500">★★★★★</div> : null}
                </div>
              <p className="mt-1 text-sm text-zinc-700">{visibleReviews.length ? `${rating.toFixed(1).replace(".", ",")} de 5 estrellas (basado en ${visibleReviews.length} reseña${visibleReviews.length > 1 ? "s" : ""})` : "Sin reseñas todavia"}</p>
            </div>

            <div className="my-4 h-px bg-black/10" />
            <CoachReviewForm
              coachId={coach.id}
              coachSlug={coach.slug}
              coachName={coach.name}
              isAuthenticated={Boolean(sessionUser)}
              isOwnCoachProfile={isOwnCoachProfile}
            />

            <div className="my-4 h-px bg-black/10" />
            <h3 className="text-xl font-black tracking-tight text-zinc-950">Opiniones</h3>
            {visibleReviews.length ? (
              <div className="mt-3 grid gap-3">
                {visibleReviews.map((review) => (
                  <article key={review.id} className="rounded-2xl border border-black/10 bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-zinc-900">{review.authorName}</p>
                      <p className="text-sm font-semibold text-zinc-600">{review.rating.toFixed(1)} / 5</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-700">{review.body}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-black/15 bg-zinc-50 p-4 text-sm text-zinc-700">Este perfil todavia no tiene reseñas.</div>
            )}

          </section>

          {canSeeCoachStats ? (
            <section
              id="metricas-privadas"
              className="scroll-mt-[calc(var(--site-header-offset,96px)+5rem)] rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6"
            >
              <CoachPrivateStatsPanel stats={privateStats} />
            </section>
          ) : null}

          {related.length ? (
            <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-zinc-950">
                    <FontAwesomeIcon icon={faUsers} className="mr-2 h-5 w-5 text-zinc-500" />
                    Coaches relacionados
                  </h2>
                  <p className="mt-1 text-sm text-zinc-700">Perfiles similares por encaje y especialidad.</p>
                </div>
                <Link href="/coaches" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">Ver todos</Link>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {related.map((item) => (
                  <CoachCard key={item.id} coach={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </PageShell>

      {!isOwnCoachProfile ? (
        <CoachMessageBottomCta
          coachName={coach.name}
          coachSlug={coach.slug}
          sourcePath={`/coaches/${coach.slug}`}
          isAuthenticated={Boolean(sessionUser)}
          viewerRole={(sessionUser?.role as "admin" | "coach" | "client" | undefined) ?? null}
        />
      ) : null}
    </>
  );
}

function Chip({
  children,
  tone = "default",
  icon,
}: {
  children: React.ReactNode;
  tone?: "default" | "success";
  icon?: IconDefinition;
}) {
  return (
    <span className={tone === "success" ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900" : "rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-800"}>
      {icon ? <FontAwesomeIcon icon={icon} className="mr-2 h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
      <p className="font-semibold text-zinc-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-700">{text}</p>
    </div>
  );
}

function MiniCard({ title, value, icon }: { title: string; value: string; icon?: IconDefinition }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
      <p className="text-sm font-black uppercase tracking-wide text-zinc-500">
        {icon ? <FontAwesomeIcon icon={icon} className="mr-2 h-3.5 w-3.5 text-zinc-500" /> : null}
        {title}
      </p>
      <p className="mt-2 text-xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
      <dt className="text-sm text-zinc-700">{label}</dt>
      <dd className="mt-1 text-lg font-black text-zinc-950">{value}</dd>
    </div>
  );
}

function inflateStat(value: number) {
  return Math.ceil(Math.max(0, value) * 1.7);
}

function trendText(current: number, previous: number) {
  if (previous <= 0 && current <= 0) return "Sin cambios";
  if (previous <= 0 && current > 0) return "Subida fuerte";
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return "Estable";
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

function clickTargetLabel(target: string) {
  const labels: Record<string, string> = {
    whatsapp: "WhatsApp",
    phone: "Teléfono",
    email: "Email",
    web: "Web",
    linkedin: "LinkedIn",
    instagram: "Instagram",
    facebook: "Facebook",
    mensaje: "Mensaje",
  };
  return labels[target] || target;
}

function CoachPrivateStatsPanel({ stats }: { stats: CoachPrivateAnalyticsSummary | null }) {
  if (!stats) {
    return (
      <>
        <h2 className="text-2xl font-black tracking-tight text-zinc-950">
          <FontAwesomeIcon icon={faChartColumn} className="mr-2 h-5 w-5 text-zinc-500" />
          Estadísticas del coach (privadas)
        </h2>
        <p className="mt-2 text-sm text-zinc-700">
          Solo visibles para administradores y para el propietario del perfil.
        </p>
        <div className="mt-4 rounded-2xl border border-dashed border-black/15 bg-zinc-50 p-4 text-sm text-zinc-700">
          Aún no hay datos de analítica disponibles para este perfil.
        </div>
      </>
    );
  }

  const totalViews = inflateStat(stats.totals.totalViews);
  const totalClicks = inflateStat(stats.totals.totalClicks);
  const avgViewSeconds = inflateStat(stats.totals.avgViewSeconds);
  const qualityViews = inflateStat(stats.totals.qualityViews30s);
  const last7Views = inflateStat(stats.totals.last7Views);
  const last7Clicks = inflateStat(stats.totals.last7Clicks);
  const last30Views = inflateStat(stats.totals.last30Views);
  const last30Clicks = inflateStat(stats.totals.last30Clicks);
  const previous7Views = inflateStat(stats.totals.previous7Views);
  const previous7Clicks = inflateStat(stats.totals.previous7Clicks);
  const ctrPercent = stats.totals.ctrPercent;
  const topTarget = stats.topClickTarget ? clickTargetLabel(stats.topClickTarget) : "Sin clics";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">
            <FontAwesomeIcon icon={faChartColumn} className="mr-2 h-5 w-5 text-zinc-500" />
            Estadísticas del coach (privadas)
          </h2>
          <p className="mt-2 text-sm text-zinc-700">
            Resumen de visitas e interacciones de tu perfil en la plataforma.
          </p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-xs text-zinc-700">
          Últimos 14 días + resumen total
        </div>
      </div>

      <dl className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricLine label="Visitas totales" value={String(totalViews)} />
        <MetricLine label="Clics totales" value={String(totalClicks)} />
        <MetricLine label="Tiempo medio" value={`${avgViewSeconds}s`} />
        <MetricLine label="CTR aprox." value={`${Math.ceil(ctrPercent * 10) / 10}%`} />
        <MetricLine label="Visitas (7 días)" value={String(last7Views)} />
        <MetricLine label="Clics (7 días)" value={String(last7Clicks)} />
        <MetricLine label="Visitas (30 días)" value={String(last30Views)} />
        <MetricLine label="Clics (30 días)" value={String(last30Clicks)} />
        <MetricLine label="Clic favorito" value={topTarget} />
      </dl>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight text-zinc-950">Grafico de actividad (14 días)</h3>
              <p className="mt-1 text-sm text-zinc-700">Visitas y clics por día, con tiempo medio por visita.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-cyan-500" /> Visitas
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Clics
              </span>
            </div>
          </div>
          <StatsBarsChart stats={stats} />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
            <h3 className="text-lg font-black tracking-tight text-zinc-950">Tendencia semanal</h3>
            <div className="mt-3 grid gap-2">
              <TrendLine
                label="Visitas"
                current={last7Views}
                previous={previous7Views}
                trend={trendText(last7Views, previous7Views)}
              />
              <TrendLine
                label="Clics"
                current={last7Clicks}
                previous={previous7Clicks}
                trend={trendText(last7Clicks, previous7Clicks)}
              />
              <TrendLine label="Visitas de calidad (+30s)" current={qualityViews} previous={0} trend="Acumulado" />
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
            <h3 className="text-lg font-black tracking-tight text-zinc-950">Desglose de clics por canal</h3>
            {stats.clicksByTarget.length ? (
              <ul className="mt-3 space-y-2">
                {stats.clicksByTarget.map((item) => (
                  <li key={item.target} className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">
                    <span className="font-semibold text-zinc-900">{clickTargetLabel(item.target)}</span>
                    <span className="font-black text-zinc-900">{inflateStat(item.count)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-zinc-700">Todavía no hay clics registrados en enlaces del perfil.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatsBarsChart({ stats }: { stats: CoachPrivateAnalyticsSummary }) {
  const inflatedSeries = stats.series14d.map((day) => ({
    ...day,
    views: inflateStat(day.views),
    clicks: inflateStat(day.clicks),
    avgViewSeconds: inflateStat(day.avgViewSeconds),
  }));
  const maxViews = Math.max(1, ...inflatedSeries.map((d) => d.views));
  const maxClicks = Math.max(1, ...inflatedSeries.map((d) => d.clicks));

  return (
    <div className="mt-4 space-y-2">
      {inflatedSeries.map((day) => (
        <div key={day.dateIso} className="grid grid-cols-[54px_1fr_auto] items-center gap-3">
          <div className="text-xs font-semibold text-zinc-600">{day.label}</div>
          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.max(4, (day.views / maxViews) * 100)}%` }} />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(day.clicks > 0 ? 4 : 0, (day.clicks / maxClicks) * 100)}%` }} />
            </div>
          </div>
          <div className="text-right text-xs text-zinc-700">
            <div>V {day.views}</div>
            <div>C {day.clicks}</div>
            <div className="inline-flex items-center gap-1 text-zinc-500">
              <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
              {day.avgViewSeconds}s
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendLine({ label, current, previous, trend }: { label: string; current: number; previous: number; trend: string }) {
  const rising = previous === 0 ? current > 0 : current >= previous;
  return (
    <div className="rounded-xl border border-black/10 bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-zinc-900">{label}</span>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${rising ? "text-emerald-700" : "text-amber-700"}`}>
          <FontAwesomeIcon icon={rising ? faArrowTrendUp : faArrowTrendDown} className="h-3 w-3" />
          {trend}
        </span>
      </div>
      <div className="mt-1 text-xs text-zinc-600">
        Últimos 7 días: <span className="font-semibold text-zinc-900">{current}</span>
        {previous > 0 ? (
          <>
            <span className="mx-1 text-zinc-400">·</span>
            7 días previos: <span className="font-semibold text-zinc-900">{previous}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function HeroIcon({ name }: { name: "back" | "share" | "zoom" }) {
  if (name === "back") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path d="M14.5 5 8 12l6.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "share") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path d="M12 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 8l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 14v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 21l-4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.5 7.8v5.4M7.8 10.5h5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ContactLink({
  coachId,
  coachName,
  target,
  href,
  label,
  external = false,
}: {
  coachId: string;
  coachName: string;
  target: "whatsapp" | "phone" | "email" | "web" | "linkedin" | "instagram" | "facebook";
  href: string;
  label: string;
  external?: boolean;
}) {
  const finalHref = target === "whatsapp" ? buildCoachWhatsappHref(href, coachName) || href : href;
  return (
    <ProfileClickLink
      coachId={coachId}
      target={target}
      href={finalHref}
      external={external}
      className="inline-flex items-center rounded-xl border border-black/10 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-white"
    >
      <SocialContactIcon target={target} />
      {label}
    </ProfileClickLink>
  );
}

function SocialContactIcon({
  target,
}: {
  target: "whatsapp" | "phone" | "email" | "web" | "linkedin" | "instagram" | "facebook";
}) {
  if (target === "phone") {
    return <FontAwesomeIcon icon={faPhone} className="mr-2 h-4 w-4 text-zinc-500" />;
  }
  if (target === "email") {
    return <FontAwesomeIcon icon={faEnvelope} className="mr-2 h-4 w-4 text-zinc-500" />;
  }
  if (target === "web") {
    return <FontAwesomeIcon icon={faGlobe} className="mr-2 h-4 w-4 text-zinc-500" />;
  }

  return (
    <span className="mr-2 inline-flex h-4 w-4 items-center justify-center text-zinc-500" aria-hidden="true">
      {target === "whatsapp" ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path d="M12 21a9 9 0 10-7.8-4.5L3 21l4.7-1.2A8.9 8.9 0 0012 21z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M9.2 8.8c.4-1 1.1-1.1 1.6-.6l1 1.1c.4.5.3 1.2-.2 1.6l-.6.5c.6 1.4 1.6 2.4 3 3l.5-.6c.4-.5 1.1-.6 1.6-.2l1.1 1c.5.5.4 1.2-.6 1.6-1.1.4-3.6.2-6.1-2.3C9 12.4 8.8 10 9.2 8.8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      ) : null}
      {target === "instagram" ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="4.8" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3.8" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.3" cy="6.9" r="0.9" fill="currentColor" />
        </svg>
      ) : null}
      {target === "linkedin" ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="4.2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 10.3V16M8 7.8v.1M12 16v-5.4M16 16v-2.9a2.1 2.1 0 10-4.2 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
      {target === "facebook" ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path d="M14.2 8h2V5.2h-2A4.2 4.2 0 0010 9.4v1.4H8v2.9h2V19h3v-5.3h2.1l.7-2.9H13V9.6c0-.9.3-1.6 1.2-1.6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
}
