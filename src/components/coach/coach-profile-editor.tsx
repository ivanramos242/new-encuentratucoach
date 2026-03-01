"use client";

import {
  faArrowLeft,
  faArrowRight,
  faCheck,
  faEye,
  faFloppyDisk,
  faImage,
  faLightbulb,
  faListCheck,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { COACH_CATEGORY_CATALOG } from "@/lib/coach-category-catalog";

type ProfileStatusValue = "draft" | "pending_review" | "published" | "paused" | "archived";
type VisibilityStatusValue = "active" | "inactive";
type CertifiedStatusValue = "none" | "pending" | "approved" | "rejected";

type EditorProfile = {
  id?: string;
  slug?: string | null;
  name?: string | null;
  headline?: string | null;
  bio?: string | null;
  aboutHtml?: string | null;
  gender?: string | null;
  specialtiesText?: string | null;
  languagesText?: string | null;
  heroImageUrl?: string | null;
  videoPresentationUrl?: string | null;
  featured?: boolean;
  certifiedStatus?: CertifiedStatusValue | string | null;
  messagingEnabled?: boolean;
  messagingAutoReply?: string | null;
  messagingReplySlaMinutes?: number | null;
  qaAnswersCount?: number | null;
  qaAcceptedAnswersCount?: number | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  publishedAt?: string | Date | null;
  owner?: {
    id?: string;
    email?: string | null;
    displayName?: string | null;
    role?: string;
    isActive?: boolean;
  } | null;
  location?: { city?: string | null; province?: string | null; country?: string | null } | null;
  pricing?: { basePriceEur?: number | null; detailsHtml?: string | null; notes?: string | null } | null;
  links?: Array<{ type: string; value: string }>;
  categories?: Array<{ category?: { slug?: string | null; name?: string | null } | null }>;
  galleryAssets?: Array<{ url: string }>;
  sessionModes?: Array<{ mode: "online" | "presencial" }>;
  profileStatus?: ProfileStatusValue | string | null;
  visibilityStatus?: VisibilityStatusValue | string | null;
};

type UploadScope = "coach_gallery" | "coach_hero" | "coach_video";
const MAX_COACH_CATEGORIES = 4;

async function postJson(url: string, payload: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({ ok: false, message: `Error ${res.status}` }));
  if (!res.ok || !json.ok) throw new Error(json.message || "Error inesperado");
  return json;
}

async function uploadViaPresign(input: { file: File; scope: UploadScope; coachProfileId?: string }) {
  const presign = (await postJson("/api/uploads/presign", {
    scope: input.scope,
    fileName: input.file.name,
    contentType: input.file.type,
    sizeBytes: input.file.size,
    coachProfileId: input.coachProfileId,
  })) as {
    uploadUrl?: string;
    publicObjectUrl?: string | null;
    storageKey?: string;
  };

  if (!presign.uploadUrl) throw new Error("No se recibio URL de subida");

  const put = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: {
      "content-type": input.file.type || "application/octet-stream",
    },
    body: input.file,
  });
  if (!put.ok) throw new Error(`La subida ha fallado (HTTP ${put.status})`);

  const finalUrl = presign.publicObjectUrl || presign.uploadUrl.split("?")[0];
  if (!finalUrl) throw new Error("No se pudo resolver la URL final del archivo subido");
  return { url: finalUrl, storageKey: presign.storageKey || null };
}

async function deleteUploadedObject(input: { url: string; coachProfileId?: string }) {
  await postJson("/api/uploads/delete", {
    url: input.url,
    coachProfileId: input.coachProfileId,
  });
}

function fieldInputClass(invalid = false) {
  return `rounded-xl border px-3 py-2 ${invalid ? "border-red-300 bg-red-50/40" : "border-black/10"}`;
}

function formatDateLabel(value?: string | Date | null) {
  if (!value) return "No disponible";
  try {
    return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function CountPill({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        done ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-black/10 bg-zinc-50 text-zinc-700"
      }`}
    >
      <span>{done ? "OK" : "Pendiente"}</span>
      <span>{label}</span>
    </span>
  );
}

function StepBadge({ done, label, current }: { done: boolean; label: string; current: boolean }) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 text-sm ${
        current
          ? "border-cyan-300 bg-cyan-50 text-cyan-900"
          : done
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-black/10 bg-white text-zinc-700"
      }`}
    >
      {done ? "✓" : current ? ">" : "•"} {label}
    </div>
  );
}

function SeoHelpPanel({
  form,
}: {
  form: {
    name: string;
    headline: string;
    bio: string;
    city: string;
    specialtiesText: string;
    categorySlugs: string[];
    basePriceEur: string;
    heroImageUrl: string;
    web: string;
  };
}) {
  const seoChecks = [
    { label: "Nombre y ciudad claros", ok: Boolean(form.name.trim() && form.city.trim()) },
    { label: "Explicas a quien ayudas", ok: form.bio.trim().length >= 120 },
    { label: "Especialidades escritas", ok: Boolean(form.specialtiesText.trim()) },
    { label: "Categorias marcadas", ok: form.categorySlugs.length > 0 },
    { label: "Precio orientativo puesto", ok: Number(form.basePriceEur) > 0 },
    { label: "Foto principal subida", ok: Boolean(form.heroImageUrl.trim()) },
    { label: "Canal propio (web) añadido", ok: Boolean(form.web.trim()) },
  ];
  const score = seoChecks.filter((item) => item.ok).length;

  return (
    <section className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            <FontAwesomeIcon icon={faLightbulb} className="mr-2 h-3 w-3" />
            Consejos para que te encuentren mejor
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-zinc-950">Rellena el perfil pensando en personas reales</h3>
          <p className="mt-1 text-sm text-zinc-700">
            Escribe claro, como si estuvieras hablando con alguien que busca ayuda hoy.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900">
          Perfil listo para buscarte: {score}/{seoChecks.length}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {seoChecks.map((item) => (
          <CountPill key={item.label} done={item.ok} label={item.label} />
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200/70 bg-white p-4 text-sm text-zinc-800">
          <p className="font-bold text-zinc-950">Que escribir (buena idea)</p>
          <p className="mt-2 leading-6">
            &quot;Ayudo a personas con ansiedad por trabajo en Madrid a recuperar calma y orden en su semana.&quot;
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white p-4 text-sm text-zinc-800">
          <p className="font-bold text-zinc-950">Que evitar</p>
          <p className="mt-2 leading-6">
            Frases vacias como &quot;acompanamiento transformacional&quot; sin explicar para quien es ni que problema ayudas a mejorar.
          </p>
        </div>
      </div>

      <ul className="mt-4 grid gap-2 text-sm text-zinc-700">
        <li>Cuenta para quien es tu ayuda, en que casos y con que enfoque trabajas.</li>
        <li>Usa palabras normales (como hablan tus clientes) y no solo palabras bonitas.</li>
        <li>Incluye ciudad, modalidad (online/presencial) y un precio orientativo para generar confianza.</li>
        <li>Sube una foto clara y actual. Un perfil completo suele recibir mas contactos.</li>
        <li>Actualiza el texto cada vez que cambies servicios, foco o ciudad.</li>
      </ul>
    </section>
  );
}

function ProfileLivePreview({
  form,
}: {
  form: {
    name: string;
    headline: string;
    heroImageSrc?: string | null;
    city: string;
    modeOnline: boolean;
    modePresencial: boolean;
    basePriceEur: string;
    categorySlugs: string[];
    whatsapp: string;
    email: string;
    phone: string;
    web: string;
  };
}) {
  const categoryLabels = COACH_CATEGORY_CATALOG.filter((item) => form.categorySlugs.includes(item.slug)).map(
    (item) => item.name,
  );

  return (
    <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
            <FontAwesomeIcon icon={faEye} className="mr-2 h-3 w-3" />
            Vista previa
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-zinc-950">
            {form.name.trim() || "Tu nombre de perfil"}
          </h3>
          <p className="mt-1 text-sm text-zinc-700">
            {[form.city.trim(), form.modeOnline ? "online" : "", form.modePresencial ? "presencial" : ""]
              .filter(Boolean)
              .join(" · ") || "Anade ciudad y modalidad"}
          </p>
        </div>
        <span className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
          {form.basePriceEur && Number(form.basePriceEur) > 0 ? `Desde ${form.basePriceEur} EUR` : "Precio pendiente"}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-zinc-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={form.heroImageSrc?.trim() || "https://placehold.co/900x520/png?text=Imagen+principal"}
            alt="Vista previa imagen principal"
            className="h-44 w-full object-cover"
          />
        </div>
        <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Titular</p>
          <p className="mt-1 text-sm text-zinc-800">
            {form.headline.trim() || "Resume en una frase a quien ayudas y como lo haces."}
          </p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Categorias elegidas</p>
          <p className="mt-1 text-sm text-zinc-800">
            {categoryLabels.length ? categoryLabels.join(", ") : "Todavia no has marcado categorias."}
          </p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Canales de contacto</p>
          <p className="mt-1 text-sm text-zinc-800">
            {[
              form.whatsapp.trim() ? "WhatsApp" : "",
              form.email.trim() ? "Email" : "",
              form.phone.trim() ? "Telefono" : "",
              form.web.trim() ? "Web" : "",
            ]
              .filter(Boolean)
              .join(" · ") || "Anade al menos un canal para recibir contactos"}
          </p>
        </div>
        <p className="text-xs leading-5 text-zinc-500">
          Esta vista previa es orientativa. El perfil publico final puede mostrar bloques adicionales.
        </p>
      </div>
    </section>
  );
}

function UploadDropzone({
  label,
  hint,
  accept,
  multiple = false,
  onFilesSelected,
  uploading,
}: {
  label: string;
  hint: string;
  accept: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files || []);
        if (!files.length) return;
        onFilesSelected(files);
      }}
      className={`rounded-2xl border-2 border-dashed p-4 text-sm ${
        dragOver ? "border-cyan-400 bg-cyan-50" : "border-black/15 bg-zinc-50"
      }`}
    >
      <p className="font-semibold text-zinc-900">
        <FontAwesomeIcon icon={faImage} className="mr-2 h-3.5 w-3.5 text-zinc-500" />
        {label}
      </p>
      <p className="mt-1 text-zinc-600">{hint}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 font-semibold text-zinc-900 disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faImage} className="mr-2 h-3.5 w-3.5 text-zinc-500" />
          {uploading ? "Subiendo..." : multiple ? "Seleccionar archivos" : "Seleccionar archivo"}
        </button>
        <span className="self-center text-xs text-zinc-500">Arrastra y suelta aqui</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (!files.length) return;
          onFilesSelected(files);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}

export function CoachProfileEditor({
  initialProfile,
  wizardMode = false,
  adminMode = false,
  targetCoachProfileId,
  returnToPath,
}: {
  initialProfile: EditorProfile | null;
  wizardMode?: boolean;
  adminMode?: boolean;
  targetCoachProfileId?: string;
  returnToPath?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState<null | "hero" | "video" | "gallery">(null);
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; text: string }>({ type: "idle", text: "" });
  const [wizardStep, setWizardStep] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const [autoSavingStep, setAutoSavingStep] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [heroPreviewSrc, setHeroPreviewSrc] = useState<string | null>(initialProfile?.heroImageUrl || null);
  const [videoPreviewSrc, setVideoPreviewSrc] = useState<string | null>(initialProfile?.videoPresentationUrl || null);
  const [galleryPreviewSrcs, setGalleryPreviewSrcs] = useState<string[]>(
    (initialProfile?.galleryAssets || []).map((a) => a.url).slice(0, 8),
  );
  const autoSaveInFlightRef = useRef(false);
  const editorTargetProfileId = targetCoachProfileId || initialProfile?.id || undefined;
  const linkValue = (type: string) => initialProfile?.links?.find((l) => l.type === type)?.value || "";
  const [form, setForm] = useState({
    name: initialProfile?.name || "",
    headline: initialProfile?.headline || "",
    bio: initialProfile?.bio || "",
    aboutHtml: initialProfile?.aboutHtml || "",
    gender: initialProfile?.gender || "",
    specialtiesText: initialProfile?.specialtiesText || "",
    languagesText: initialProfile?.languagesText || "",
    city: initialProfile?.location?.city || "",
    province: initialProfile?.location?.province || "",
    heroImageUrl: initialProfile?.heroImageUrl || "",
    videoPresentationUrl: initialProfile?.videoPresentationUrl || "",
    basePriceEur: String(initialProfile?.pricing?.basePriceEur ?? ""),
    pricingDetailsHtml: initialProfile?.pricing?.detailsHtml || "",
    pricingNotes: initialProfile?.pricing?.notes || "",
    web: linkValue("web"),
    linkedin: linkValue("linkedin"),
    instagram: linkValue("instagram"),
    facebook: linkValue("facebook"),
    whatsapp: linkValue("whatsapp"),
    email: linkValue("email"),
    phone: linkValue("phone"),
    galleryUrls: (initialProfile?.galleryAssets || []).map((a) => a.url).join("\n"),
    categorySlugs: (initialProfile?.categories || [])
      .map((item) => item.category?.slug || "")
      .filter(Boolean)
      .slice(0, MAX_COACH_CATEGORIES),
    modeOnline: (initialProfile?.sessionModes || []).some((m) => m.mode === "online"),
    modePresencial: (initialProfile?.sessionModes || []).some((m) => m.mode === "presencial"),
    profileStatus: (initialProfile?.profileStatus as ProfileStatusValue) || "draft",
    visibilityStatus: (initialProfile?.visibilityStatus as VisibilityStatusValue) || "inactive",
    certifiedStatus: (initialProfile?.certifiedStatus as CertifiedStatusValue) || "none",
    featured: Boolean(initialProfile?.featured),
    messagingEnabled: initialProfile?.messagingEnabled ?? true,
    messagingAutoReply: initialProfile?.messagingAutoReply || "",
    messagingReplySlaMinutes:
      typeof initialProfile?.messagingReplySlaMinutes === "number"
        ? String(initialProfile.messagingReplySlaMinutes)
        : "",
  });

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }

  const steps = useMemo(
    () => [
      {
        label: "Datos basicos",
        done: Boolean(form.name.trim() && (form.bio.trim() || form.aboutHtml.trim()) && form.categorySlugs.length),
      },
      { label: "Ciudad y modalidad", done: Boolean(form.city.trim() && (form.modeOnline || form.modePresencial)) },
      { label: "Precio y condiciones", done: Boolean(form.basePriceEur && Number(form.basePriceEur) > 0) },
      { label: "Contacto y media", done: Boolean(form.whatsapp.trim() || form.email.trim() || form.web.trim()) },
    ],
    [form],
  );
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const currentStep = wizardMode ? wizardStep : -1;

  function getStepErrors(stepIndex: number) {
    if (stepIndex === 0) {
      return {
        name: !form.name.trim() ? "El nombre visible es obligatorio." : "",
        bio: !(form.bio.trim() || form.aboutHtml.trim()) ? "Escribe una bio corta o un texto largo." : "",
        categories: !form.categorySlugs.length ? "Selecciona al menos una categoria." : "",
      };
    }
    if (stepIndex === 1) {
      return {
        city: !form.city.trim() ? "La ciudad es obligatoria." : "",
        sessionModes: !(form.modeOnline || form.modePresencial) ? "Selecciona al menos una modalidad." : "",
      };
    }
    if (stepIndex === 2) {
      const price = Number(form.basePriceEur);
      return {
        basePriceEur: !form.basePriceEur || !Number.isFinite(price) || price <= 0 ? "Indica un precio base mayor que 0." : "",
      };
    }
    if (stepIndex === 3) {
      return {
        contact:
          !(form.whatsapp.trim() || form.email.trim() || form.web.trim()) ? "Añade al menos un canal de contacto (WhatsApp, email o web)." : "",
      };
    }
    return {};
  }

  const currentStepErrors = getStepErrors(Math.max(0, currentStep));
  const galleryUrlsList = form.galleryUrls
    .split(/\r?\n/)
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 8);

  async function saveDraftSilent(reason?: string) {
    if (autoSaveInFlightRef.current) return false;
    autoSaveInFlightRef.current = true;
    try {
      await postJson("/api/coach-profile/save", buildPayload());
      setIsDirty(false);
      setStatus({
        type: "ok",
        text: reason ? `Autoguardado correcto (${reason}).` : "Autoguardado correcto.",
      });
      return true;
    } catch (error) {
      setStatus({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo autoguardar el perfil.",
      });
      return false;
    } finally {
      autoSaveInFlightRef.current = false;
    }
  }

  useEffect(() => {
    if (!wizardMode) return;
    if (!isDirty) return;
    if (pending || uploading !== null) return;

    const timer = window.setTimeout(() => {
      void saveDraftSilent("temporizador");
    }, 5000);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardMode, isDirty, pending, uploading, form]); // form included so debounce restarts on changes

  useEffect(() => {
    if (form.heroImageUrl && !heroPreviewSrc) setHeroPreviewSrc(form.heroImageUrl);
  }, [form.heroImageUrl, heroPreviewSrc]);

  useEffect(() => {
    if (form.videoPresentationUrl && !videoPreviewSrc) setVideoPreviewSrc(form.videoPresentationUrl);
  }, [form.videoPresentationUrl, videoPreviewSrc]);

  useEffect(() => {
    if (!galleryUrlsList.length) {
      if (galleryPreviewSrcs.length) setGalleryPreviewSrcs([]);
      return;
    }
    if (galleryPreviewSrcs.length === galleryUrlsList.length) return;
    setGalleryPreviewSrcs(galleryUrlsList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.galleryUrls]);

  async function goToWizardStep(nextStep: number) {
    if (!wizardMode) {
      setWizardStep(nextStep);
      return;
    }

    const bounded = Math.max(0, Math.min(steps.length - 1, nextStep));
    if (bounded === wizardStep) return;

    const errors = getStepErrors(wizardStep);
    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors && bounded > wizardStep) {
      setShowValidation(true);
      setStatus({ type: "error", text: "Completa los campos obligatorios del paso actual antes de continuar." });
      return;
    }

    setAutoSavingStep(wizardStep);
    const ok = await saveDraftSilent(`paso ${wizardStep + 1}`);
    setAutoSavingStep(null);
    if (!ok && bounded > wizardStep) return;
    setShowValidation(false);
    setWizardStep(bounded);
  }

  function buildPayload() {
    const sessionModes = [
      ...(form.modeOnline ? (["online"] as const) : []),
      ...(form.modePresencial ? (["presencial"] as const) : []),
    ];
    return {
      coachProfileId: editorTargetProfileId,
      name: form.name,
      headline: form.headline || null,
      bio: form.bio || null,
      aboutHtml: form.aboutHtml || null,
      gender: form.gender || null,
      specialtiesText: form.specialtiesText || null,
      languagesText: form.languagesText || null,
      heroImageUrl: form.heroImageUrl || null,
      videoPresentationUrl: form.videoPresentationUrl || null,
      location: form.city ? { city: form.city, province: form.province || null, country: "España" } : null,
      sessionModes,
      pricing: {
        basePriceEur: form.basePriceEur ? Number(form.basePriceEur) : null,
        detailsHtml: form.pricingDetailsHtml || null,
        notes: form.pricingNotes || null,
      },
      links: {
        web: form.web || null,
        linkedin: form.linkedin || null,
        instagram: form.instagram || null,
        facebook: form.facebook || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        phone: form.phone || null,
      },
      ...(adminMode
        ? {
            featured: form.featured,
            messagingEnabled: form.messagingEnabled,
            messagingAutoReply: form.messagingAutoReply || null,
            messagingReplySlaMinutes: form.messagingReplySlaMinutes
              ? Number(form.messagingReplySlaMinutes)
              : null,
            profileStatus: form.profileStatus,
            visibilityStatus: form.visibilityStatus,
            certifiedStatus: form.certifiedStatus,
          }
        : {}),
      categorySlugs: form.categorySlugs,
      galleryUrls: form.galleryUrls
        .split(/\r?\n/)
        .map((v) => v.trim())
        .filter(Boolean),
    };
  }

  function onSave() {
    startTransition(async () => {
      setStatus({ type: "idle", text: "" });
      try {
        await postJson("/api/coach-profile/save", buildPayload());
        setIsDirty(false);
        if (!adminMode && returnToPath) {
          router.push(returnToPath);
          router.refresh();
          return;
        }
        setStatus({ type: "ok", text: "Perfil guardado correctamente." });
      } catch (error) {
        setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo guardar el perfil." });
      }
    });
  }

  function onPublish() {
    startTransition(async () => {
      setStatus({ type: "idle", text: "" });
      try {
        if (wizardMode && !allDone) {
          setShowValidation(true);
          setStatus({ type: "error", text: "Completa todos los pasos obligatorios del formulario antes de publicar." });
          return;
        }
        const saved = (await postJson("/api/coach-profile/save", buildPayload())) as {
          profile?: { slug?: string | null };
        };
        setIsDirty(false);
        const published = (await postJson(
          "/api/coach-profile/publish",
          editorTargetProfileId ? { coachProfileId: editorTargetProfileId } : {},
        )) as {
          profile?: { slug?: string | null };
        };
        const publicSlug = published.profile?.slug || saved.profile?.slug || initialProfile?.slug || null;
        if (!adminMode && publicSlug) {
          router.push(`/coaches/${publicSlug}`);
          router.refresh();
          return;
        }
        setStatus({ type: "ok", text: "Perfil publicado correctamente." });
      } catch (error) {
        setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo publicar el perfil." });
      }
    });
  }

  async function handleHeroUpload(files: File[]) {
    const file = files[0];
    if (!file) return;
    setUploading("hero");
    setStatus({ type: "idle", text: "" });
    try {
      const uploaded = await uploadViaPresign({
        file,
        scope: "coach_hero",
        coachProfileId: editorTargetProfileId,
      });
      setField("heroImageUrl", uploaded.url);
      setHeroPreviewSrc(URL.createObjectURL(file));
      setStatus({ type: "ok", text: "Imagen principal subida. Guarda el perfil para persistirla." });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo subir la imagen." });
    } finally {
      setUploading(null);
    }
  }

  async function handleVideoUpload(files: File[]) {
    const file = files[0];
    if (!file) return;
    setUploading("video");
    setStatus({ type: "idle", text: "" });
    try {
      const uploaded = await uploadViaPresign({
        file,
        scope: "coach_video",
        coachProfileId: editorTargetProfileId,
      });
      setField("videoPresentationUrl", uploaded.url);
      setVideoPreviewSrc(URL.createObjectURL(file));
      setStatus({ type: "ok", text: "Video subido. Guarda el perfil para persistirlo." });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo subir el video." });
    } finally {
      setUploading(null);
    }
  }

  async function handleGalleryUpload(files: File[]) {
    const validFiles = files.filter((f) => f.type.startsWith("image/"));
    if (!validFiles.length) return;
    setUploading("gallery");
    setStatus({ type: "idle", text: "" });
    try {
      const urls: string[] = [];
      const localPreviews: string[] = [];
      for (const file of validFiles.slice(0, 8)) {
        const uploaded = await uploadViaPresign({
          file,
          scope: "coach_gallery",
          coachProfileId: editorTargetProfileId,
        });
        urls.push(uploaded.url);
        localPreviews.push(URL.createObjectURL(file));
      }
      const existing = form.galleryUrls
        .split(/\r?\n/)
        .map((v) => v.trim())
        .filter(Boolean);
      const merged = [...existing, ...urls].slice(0, 8);
      setField("galleryUrls", merged.join("\n"));
      setGalleryPreviewSrcs((prev) => [...prev, ...localPreviews].slice(0, 8));
      setStatus({ type: "ok", text: "Galeria subida. Guarda el perfil para persistirla." });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo subir la galeria." });
    } finally {
      setUploading(null);
    }
  }

  function showStep(idx: number) {
    return !wizardMode || currentStep === idx;
  }

  function removeGalleryAt(index: number) {
    const next = galleryUrlsList.filter((_, i) => i !== index);
    setField("galleryUrls", next.join("\n"));
    setGalleryPreviewSrcs((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleCategorySlug(slug: string, checked: boolean) {
    const current = new Set(form.categorySlugs);
    if (checked) current.add(slug);
    else current.delete(slug);
    setField("categorySlugs", Array.from(current).slice(0, MAX_COACH_CATEGORIES));
  }

  function removeHero() {
    const url = form.heroImageUrl.trim();
    if (!url) return;
    startTransition(async () => {
      try {
        await deleteUploadedObject({ url, coachProfileId: editorTargetProfileId });
      } catch (error) {
        setStatus({
          type: "error",
          text: error instanceof Error ? `No se pudo eliminar en storage: ${error.message}` : "No se pudo eliminar la imagen",
        });
        return;
      }
      setField("heroImageUrl", "");
      setHeroPreviewSrc(null);
      setStatus({ type: "ok", text: "Imagen principal eliminada. Guarda el perfil para persistir el cambio." });
    });
  }

  function removeVideo() {
    const url = form.videoPresentationUrl.trim();
    if (!url) return;
    startTransition(async () => {
      try {
        await deleteUploadedObject({ url, coachProfileId: editorTargetProfileId });
      } catch (error) {
        setStatus({
          type: "error",
          text: error instanceof Error ? `No se pudo eliminar en storage: ${error.message}` : "No se pudo eliminar el video",
        });
        return;
      }
      setField("videoPresentationUrl", "");
      setVideoPreviewSrc(null);
      setStatus({ type: "ok", text: "Video eliminado. Guarda el perfil para persistir el cambio." });
    });
  }

  function removeGalleryAtWithStorage(index: number) {
    const url = galleryUrlsList[index];
    if (!url) return;
    startTransition(async () => {
      try {
        await deleteUploadedObject({ url, coachProfileId: editorTargetProfileId });
      } catch (error) {
        setStatus({
          type: "error",
          text:
            error instanceof Error
              ? `No se pudo eliminar en storage: ${error.message}`
              : "No se pudo eliminar la imagen de galeria",
        });
        return;
      }
      removeGalleryAt(index);
      setStatus({ type: "ok", text: "Imagen de galeria eliminada. Guarda el perfil para persistir el cambio." });
    });
  }

  return (
    <div className="grid gap-6">
      {wizardMode ? (
        <section className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                <FontAwesomeIcon icon={faListCheck} className="mr-2 h-3 w-3" />
                Formulario de bienvenida
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-zinc-950">Crea tu perfil coach paso a paso</h2>
              <p className="mt-1 text-sm text-zinc-700">Completa los pasos y luego publica tu perfil.</p>
            </div>
            <div className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900">
              Progreso: {doneCount}/{steps.length}
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {steps.map((step, idx) => (
              <button
                key={step.label}
                type="button"
                onClick={() => {
                  void goToWizardStep(idx);
                }}
                className="text-left"
              >
                <StepBadge done={step.done} label={step.label} current={wizardStep === idx} />
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={wizardStep <= 0}
              onClick={() => {
                void goToWizardStep(wizardStep - 1);
              }}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-3.5 w-3.5" />
              Paso anterior
            </button>
            <button
              type="button"
              disabled={wizardStep >= steps.length - 1}
              onClick={() => {
                void goToWizardStep(wizardStep + 1);
              }}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-50"
            >
              Siguiente paso
              <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3.5 w-3.5" />
            </button>
            {autoSavingStep !== null ? <span className="self-center text-sm text-zinc-600">Autoguardando paso {autoSavingStep + 1}...</span> : null}
          </div>
        </section>
      ) : null}

      <section className="hidden rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-tight text-zinc-950">
              {adminMode ? "Editar perfil de coach (admin)" : "Editor de perfil coach"}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {adminMode
                ? "Puedes editar el perfil publico y tambien los datos internos que no se ven en la ficha publica."
                : "Guarda tus datos y publica cuando tengas membresía activa."}
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1">
              Estado: {form.profileStatus || initialProfile?.profileStatus || "draft"}
            </span>
            <span className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1">
              Visibilidad: {form.visibilityStatus || initialProfile?.visibilityStatus || "inactive"}
            </span>
          </div>
        </div>
      </section>

      <section className="hidden grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
        <SeoHelpPanel
          form={{
            name: form.name,
            headline: form.headline,
            bio: form.bio,
            city: form.city,
            specialtiesText: form.specialtiesText,
            categorySlugs: form.categorySlugs,
            basePriceEur: form.basePriceEur,
            heroImageUrl: form.heroImageUrl,
            web: form.web,
          }}
        />

        <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Vista previa rapida</p>
              <h3 className="mt-1 text-lg font-black tracking-tight text-zinc-950">
                {form.name.trim() || "Tu nombre de perfil"}
              </h3>
              <p className="mt-1 text-sm text-zinc-700">
                {[form.city.trim(), form.modeOnline ? "online" : "", form.modePresencial ? "presencial" : ""]
                  .filter(Boolean)
                  .join(" · ") || "Anade ciudad y modalidad"}
              </p>
            </div>
            <span className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
              {form.basePriceEur && Number(form.basePriceEur) > 0 ? `Desde ${form.basePriceEur} EUR` : "Precio pendiente"}
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Titular</p>
              <p className="mt-1 text-sm text-zinc-800">
                {form.headline.trim() || "Resume en una frase a quien ayudas y como lo haces."}
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Categorias elegidas</p>
              <p className="mt-1 text-sm text-zinc-800">
                {form.categorySlugs.length
                  ? COACH_CATEGORY_CATALOG.filter((item) => form.categorySlugs.includes(item.slug))
                      .map((item) => item.name)
                      .join(", ")
                  : "Todavia no has marcado categorias."}
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Canales de contacto</p>
              <p className="mt-1 text-sm text-zinc-800">
                {[
                  form.whatsapp.trim() ? "WhatsApp" : "",
                  form.email.trim() ? "Email" : "",
                  form.phone.trim() ? "Telefono" : "",
                  form.web.trim() ? "Web" : "",
                ]
                  .filter(Boolean)
                  .join(" · ") || "Anade al menos un canal para recibir contactos"}
              </p>
            </div>
          </div>
        </section>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_.75fr] xl:items-start">
        <div className="space-y-4">
      {showStep(0) ? (
        <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-black tracking-tight text-zinc-950">Paso 1 · Datos basicos</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Nombre visible
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className={fieldInputClass(showValidation && !!currentStepErrors.name)}
                placeholder="Ej: Ana Perez"
              />
              {showValidation && currentStepErrors.name ? <span className="text-xs text-red-600">{currentStepErrors.name}</span> : null}
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Titular / headline
              <input
                value={form.headline}
                onChange={(e) => setField("headline", e.target.value)}
                className={fieldInputClass()}
                placeholder="Ej: Ayudo con ansiedad y autoestima"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Genero (opcional)
              <select value={form.gender} onChange={(e) => setField("gender", e.target.value)} className={fieldInputClass()}>
                <option value="">Prefiero no decirlo</option>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="No binario">No binario</option>
                <option value="Otro">Otro</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800 md:col-span-2">
              Sobre mi (bio)
              <textarea
                value={form.bio}
                onChange={(e) => setField("bio", e.target.value)}
                rows={5}
                className={fieldInputClass(showValidation && !!currentStepErrors.bio)}
                placeholder="Cuenta a quien ayudas, en que situaciones y como trabajas."
              />
              <span className="text-xs font-normal text-zinc-500">
                Habla claro y directo. Este texto es clave para que te entiendan rapido.
              </span>
              {showValidation && currentStepErrors.bio ? <span className="text-xs text-red-600">{currentStepErrors.bio}</span> : null}
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800 md:col-span-2">
              Sobre mi (texto largo opcional)
              <textarea
                value={form.aboutHtml}
                onChange={(e) => setField("aboutHtml", e.target.value)}
                rows={5}
                className={fieldInputClass()}
                placeholder="Amplía tu historia, tu método o cómo es una primera sesión."
              />
              <span className="text-xs font-normal text-zinc-500">
                Si lo dejas vacio, se mostrara la bio corta en tu perfil.
              </span>
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Especialidades (texto)
              <input
                value={form.specialtiesText}
                onChange={(e) => setField("specialtiesText", e.target.value)}
                className={fieldInputClass()}
                placeholder="Ej: liderazgo, autoestima, hábitos"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Idiomas (texto)
              <input
                value={form.languagesText}
                onChange={(e) => setField("languagesText", e.target.value)}
                className={fieldInputClass()}
                placeholder="Ej: Espanol, Ingles"
              />
            </label>
            <div className="grid gap-2 text-sm font-medium text-zinc-800 md:col-span-2">
              <span>Categorias (ayudan a que te encuentren mejor)</span>
              <div className="grid max-h-64 gap-2 overflow-auto rounded-xl border border-black/10 bg-zinc-50 p-3 md:grid-cols-2">
                {COACH_CATEGORY_CATALOG.map((category) => {
                  const checked = form.categorySlugs.includes(category.slug);
                  return (
                    <label
                      key={category.slug}
                      className="inline-flex items-center gap-2 rounded-lg bg-white px-2 py-2 text-sm text-zinc-800"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleCategorySlug(category.slug, e.target.checked)}
                        disabled={!checked && form.categorySlugs.length >= MAX_COACH_CATEGORIES}
                      />
                      <span>{category.name}</span>
                    </label>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-normal text-zinc-500">
                  Elige hasta {MAX_COACH_CATEGORIES} categorias que mejor describen tu ayuda.
                </span>
                <span className="text-xs font-semibold text-zinc-700">
                  {form.categorySlugs.length}/{MAX_COACH_CATEGORIES}
                </span>
              </div>
              {showValidation && (currentStepErrors as { categories?: string }).categories ? (
                <span className="text-xs font-normal text-red-600">
                  {(currentStepErrors as { categories?: string }).categories}
                </span>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {showStep(1) ? (
        <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-black tracking-tight text-zinc-950">Paso 2 · Ciudad y modalidad</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Ciudad
              <input value={form.city} onChange={(e) => setField("city", e.target.value)} className={fieldInputClass(showValidation && !!currentStepErrors.city)} />
              {showValidation && currentStepErrors.city ? <span className="text-xs text-red-600">{currentStepErrors.city}</span> : null}
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Provincia
              <input value={form.province} onChange={(e) => setField("province", e.target.value)} className={fieldInputClass()} />
            </label>
            <div className="grid gap-2 text-sm font-medium text-zinc-800 md:col-span-2">
              Modalidad
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={form.modeOnline} onChange={(e) => setField("modeOnline", e.target.checked)} />
                Online
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={form.modePresencial} onChange={(e) => setField("modePresencial", e.target.checked)} />
                Presencial
              </label>
              {showValidation && currentStepErrors.sessionModes ? (
                <span className="text-xs font-normal text-red-600">{currentStepErrors.sessionModes}</span>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {showStep(2) ? (
        <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-black tracking-tight text-zinc-950">Paso 3 · Precio y condiciones</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Precio base (EUR)
              <input
                type="number"
                value={form.basePriceEur}
                onChange={(e) => setField("basePriceEur", e.target.value)}
                className={fieldInputClass(showValidation && !!currentStepErrors.basePriceEur)}
                placeholder="40"
              />
              {showValidation && currentStepErrors.basePriceEur ? (
                <span className="text-xs text-red-600">{currentStepErrors.basePriceEur}</span>
              ) : null}
            </label>
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
              <p className="font-semibold text-zinc-900">Consejo</p>
              <p className="mt-1">
                Pon un precio orientativo real. Ayuda a que te contacten personas con mejor encaje.
              </p>
            </div>
            <label className="grid gap-1 text-sm font-medium text-zinc-800 md:col-span-2">
              Detalle de precios / condiciones
              <textarea
                value={form.pricingDetailsHtml}
                onChange={(e) => setField("pricingDetailsHtml", e.target.value)}
                rows={4}
                className={fieldInputClass()}
                placeholder="Ej: Online 60 min 40 EUR. Presencial 60 min 55 EUR. Bono 4 sesiones disponible."
              />
            </label>
            {adminMode ? (
              <label className="grid gap-1 text-sm font-medium text-zinc-800 md:col-span-2">
                Nota interna de precios (solo admin)
                <textarea
                  value={form.pricingNotes}
                  onChange={(e) => setField("pricingNotes", e.target.value)}
                  rows={3}
                  className={fieldInputClass()}
                  placeholder="Notas internas que no se muestran en el perfil publico."
                />
              </label>
            ) : null}
          </div>
        </section>
      ) : null}

      {showStep(3) ? (
        <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-black tracking-tight text-zinc-950">Paso 4 · Contacto y media</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Web
              <input
                value={form.web}
                onChange={(e) => setField("web", e.target.value)}
                className={fieldInputClass(showValidation && !!currentStepErrors.contact)}
                placeholder="https://tuweb.com"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              LinkedIn
              <input
                value={form.linkedin}
                onChange={(e) => setField("linkedin", e.target.value)}
                className={fieldInputClass()}
                placeholder="https://linkedin.com/in/..."
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Instagram
              <input
                value={form.instagram}
                onChange={(e) => setField("instagram", e.target.value)}
                className={fieldInputClass()}
                placeholder="https://instagram.com/..."
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Facebook
              <input
                value={form.facebook}
                onChange={(e) => setField("facebook", e.target.value)}
                className={fieldInputClass()}
                placeholder="https://facebook.com/..."
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              WhatsApp
              <input
                value={form.whatsapp}
                onChange={(e) => setField("whatsapp", e.target.value)}
                className={fieldInputClass(showValidation && !!currentStepErrors.contact)}
                placeholder="34600111222"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Email de contacto
              <input
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={fieldInputClass(showValidation && !!currentStepErrors.contact)}
                placeholder="hola@tuweb.com"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Telefono
              <input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className={fieldInputClass()}
                placeholder="600 111 222"
              />
            </label>
            {showValidation && currentStepErrors.contact ? (
              <p className="md:col-span-2 text-xs text-red-600">{currentStepErrors.contact}</p>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4">
            <UploadDropzone
              label="Imagen principal (hero)"
              hint="Usa una foto clara y actual. Se sube automaticamente cuando la eliges."
              accept="image/jpeg,image/png,image/webp"
              onFilesSelected={handleHeroUpload}
              uploading={uploading === "hero"}
            />
            {(heroPreviewSrc || form.heroImageUrl) ? (
              <div className="rounded-2xl border border-black/10 bg-zinc-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900">Preview imagen principal</p>
                  <button
                    type="button"
                    onClick={removeHero}
                    disabled={pending}
                    className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroPreviewSrc || form.heroImageUrl || ""}
                  alt="Preview imagen principal"
                  className="max-h-52 w-full rounded-xl object-cover"
                />
              </div>
            ) : null}

            <UploadDropzone
              label="Video de presentacion"
              hint="Opcional. Un video corto ayuda a generar confianza."
              accept="video/mp4,video/webm"
              onFilesSelected={handleVideoUpload}
              uploading={uploading === "video"}
            />
            {(videoPreviewSrc || form.videoPresentationUrl) ? (
              <div className="rounded-2xl border border-black/10 bg-zinc-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900">Preview video</p>
                  <button
                    type="button"
                    onClick={removeVideo}
                    disabled={pending}
                    className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
                <video src={videoPreviewSrc || form.videoPresentationUrl || ""} controls className="max-h-64 w-full rounded-xl bg-black" />
              </div>
            ) : null}

            <UploadDropzone
              label="Galeria de imagenes"
              hint="Puedes arrastrar varias fotos. Maximo 8 imagenes."
              accept="image/jpeg,image/png,image/webp"
              multiple
              onFilesSelected={handleGalleryUpload}
              uploading={uploading === "gallery"}
            />
            {galleryUrlsList.length ? (
              <div className="rounded-2xl border border-black/10 bg-zinc-50 p-3">
                <p className="mb-2 text-sm font-semibold text-zinc-900">Preview galeria</p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {galleryUrlsList.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={galleryPreviewSrcs[index] || url}
                        alt="Preview galeria"
                        className="h-24 w-full rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryAtWithStorage(index)}
                        className="absolute right-1 top-1 rounded-md bg-black/75 px-2 py-1 text-xs font-semibold text-white"
                        aria-label={`Eliminar imagen ${index + 1}`}
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
        </div>
        <div className="xl:sticky xl:top-6">
          <ProfileLivePreview
            form={{
              name: form.name,
              headline: form.headline,
              heroImageSrc: heroPreviewSrc || form.heroImageUrl,
              city: form.city,
              modeOnline: form.modeOnline,
              modePresencial: form.modePresencial,
              basePriceEur: form.basePriceEur,
              categorySlugs: form.categorySlugs,
              whatsapp: form.whatsapp,
              email: form.email,
              phone: form.phone,
              web: form.web,
            }}
          />
        </div>
      </section>

      {wizardMode ? (
        <section className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-zinc-700">
              <span className="font-semibold text-zinc-900">
                Paso {currentStep + 1} de {steps.length}
              </span>
              <span className="mx-2 text-zinc-400">·</span>
              <span>{steps[currentStep]?.label}</span>
            </div>
            {autoSavingStep !== null ? (
              <span className="text-xs font-medium text-zinc-600">Autoguardando paso {autoSavingStep + 1}...</span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || uploading !== null || wizardStep <= 0}
              onClick={() => {
                void goToWizardStep(wizardStep - 1);
              }}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-3.5 w-3.5" />
              Paso anterior
            </button>
            <button
              type="button"
              disabled={pending || uploading !== null || wizardStep >= steps.length - 1}
              onClick={() => {
                void goToWizardStep(wizardStep + 1);
              }}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-50"
            >
              Siguiente paso
              <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3.5 w-3.5" />
            </button>

            {allDone ? (
              <>
                <button
                  type="button"
                  disabled={pending || uploading !== null}
                  onClick={onSave}
                  className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="mr-2 h-3.5 w-3.5" />
                  {pending ? "Guardando..." : "Guardar perfil"}
                </button>
                <button
                  type="button"
                  disabled={pending || uploading !== null}
                  onClick={onPublish}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-60"
                >
                  <FontAwesomeIcon icon={faCheck} className="mr-2 h-3.5 w-3.5" />
                  Guardar y publicar
                </button>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      <SeoHelpPanel
        form={{
          name: form.name,
          headline: form.headline,
          bio: form.bio,
          city: form.city,
          specialtiesText: form.specialtiesText,
          categorySlugs: form.categorySlugs,
          basePriceEur: form.basePriceEur,
          heroImageUrl: form.heroImageUrl,
          web: form.web,
        }}
      />

      <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
              <FontAwesomeIcon icon={faPen} className="mr-2 h-3 w-3" />
              {adminMode ? "Gestion interna" : "Mi perfil"}
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-zinc-950">
              {adminMode ? "Editor de perfil de coach (admin)" : "Editor de perfil de coach"}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {adminMode
                ? "Revisa el perfil publico y, si hace falta, ajusta datos internos no visibles para clientes."
                : "Guarda los cambios y vuelve a tu perfil cuando quieras."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1">
              Estado: {form.profileStatus || initialProfile?.profileStatus || "draft"}
            </span>
            <span className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1">
              Visibilidad: {form.visibilityStatus || initialProfile?.visibilityStatus || "inactive"}
            </span>
          </div>
        </div>
      </section>

      {adminMode ? (
        <section className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Solo admin</p>
              <h3 className="mt-1 text-lg font-black tracking-tight text-zinc-950">Datos internos (no publicos)</h3>
              <p className="mt-1 text-sm text-zinc-700">
                Estos datos no se muestran en la ficha del coach. Sirven para gestion interna y control del perfil.
              </p>
            </div>
            <span className="rounded-2xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900">
              Perfil: {initialProfile?.id || editorTargetProfileId || "sin ID"}
            </span>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Estado del perfil
              <select value={form.profileStatus} onChange={(e) => setField("profileStatus", e.target.value as ProfileStatusValue)} className={fieldInputClass()}>
                <option value="draft">Borrador</option>
                <option value="pending_review">Pendiente de revision</option>
                <option value="published">Publicado</option>
                <option value="paused">Pausado</option>
                <option value="archived">Archivado</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Visibilidad en directorio
              <select
                value={form.visibilityStatus}
                onChange={(e) => setField("visibilityStatus", e.target.value as VisibilityStatusValue)}
                className={fieldInputClass()}
              >
                <option value="inactive">Oculto</option>
                <option value="active">Visible</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Certificación
              <select
                value={form.certifiedStatus}
                onChange={(e) => setField("certifiedStatus", e.target.value as CertifiedStatusValue)}
                className={fieldInputClass()}
              >
                <option value="none">Sin certificación</option>
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobada</option>
                <option value="rejected">Rechazada</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Tiempo de respuesta (min)
              <input
                type="number"
                min={0}
                step={1}
                value={form.messagingReplySlaMinutes}
                onChange={(e) => setField("messagingReplySlaMinutes", e.target.value)}
                className={fieldInputClass()}
                placeholder="Ej: 120"
              />
            </label>
            <label className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900">
              <input type="checkbox" checked={form.featured} onChange={(e) => setField("featured", e.target.checked)} />
              Perfil destacado
            </label>
            <label className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900">
              <input
                type="checkbox"
                checked={form.messagingEnabled}
                onChange={(e) => setField("messagingEnabled", e.target.checked)}
              />
              Mensajes activados para este coach
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800 md:col-span-2">
              Respuesta automatica (mensajes)
              <textarea
                value={form.messagingAutoReply}
                onChange={(e) => setField("messagingAutoReply", e.target.value)}
                rows={3}
                className={fieldInputClass()}
                placeholder="Mensaje corto para responder automaticamente cuando aplique."
              />
            </label>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-800">
              <p className="font-bold text-zinc-950">Ficha interna</p>
              <dl className="mt-2 grid gap-1">
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">ID perfil</dt>
                  <dd className="break-all text-right">{initialProfile?.id || "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Slug</dt>
                  <dd className="break-all text-right">{initialProfile?.slug || "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Creado</dt>
                  <dd className="text-right">{formatDateLabel(initialProfile?.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Actualizado</dt>
                  <dd className="text-right">{formatDateLabel(initialProfile?.updatedAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Publicado</dt>
                  <dd className="text-right">{formatDateLabel(initialProfile?.publishedAt)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-800">
              <p className="font-bold text-zinc-950">Datos ocultos al publico</p>
              <dl className="mt-2 grid gap-1">
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Usuario propietario</dt>
                  <dd className="break-all text-right">
                    {initialProfile?.owner?.displayName || initialProfile?.owner?.email || "Sin asignar"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Email propietario</dt>
                  <dd className="break-all text-right">{initialProfile?.owner?.email || "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Rol propietario</dt>
                  <dd className="text-right">{initialProfile?.owner?.role || "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Respuestas Q&A</dt>
                  <dd className="text-right">{String(initialProfile?.qaAnswersCount ?? 0)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Respuestas aceptadas</dt>
                  <dd className="text-right">{String(initialProfile?.qaAcceptedAnswersCount ?? 0)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending || uploading !== null}
            onClick={onSave}
            className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="mr-2 h-3.5 w-3.5" />
            {pending ? "Guardando..." : adminMode ? "Guardar cambios (admin)" : "Guardar perfil"}
          </button>
          <button
            type="button"
            disabled={pending || uploading !== null || (wizardMode && !allDone)}
            onClick={onPublish}
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faCheck} className="mr-2 h-3.5 w-3.5" />
            {adminMode ? "Guardar y publicar ahora" : "Guardar y publicar"}
          </button>
          {wizardMode && !allDone ? (
            <span className="self-center text-sm text-zinc-600">
              Completa todos los pasos del formulario para habilitar la publicacion.
            </span>
          ) : null}
          {adminMode ? (
            <span className="self-center text-sm text-zinc-600">
              El bloque &quot;Solo admin&quot; no se muestra en el perfil publico.
            </span>
          ) : null}
        </div>
        {status.text ? (
          <p className={`mt-4 text-sm ${status.type === "error" ? "text-red-600" : "text-emerald-700"}`}>{status.text}</p>
        ) : null}
      </section>
    </div>
  );
}
