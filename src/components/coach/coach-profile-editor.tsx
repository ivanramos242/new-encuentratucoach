"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { COACH_CATEGORY_CATALOG } from "@/lib/coach-category-catalog";

type EditorProfile = {
  id?: string;
  name?: string | null;
  headline?: string | null;
  bio?: string | null;
  specialtiesText?: string | null;
  languagesText?: string | null;
  heroImageUrl?: string | null;
  videoPresentationUrl?: string | null;
  location?: { city?: string | null; province?: string | null; country?: string | null } | null;
  pricing?: { basePriceEur?: number | null; detailsHtml?: string | null } | null;
  links?: Array<{ type: string; value: string }>;
  categories?: Array<{ category?: { slug?: string | null; name?: string | null } | null }>;
  galleryAssets?: Array<{ url: string }>;
  sessionModes?: Array<{ mode: "online" | "presencial" }>;
  profileStatus?: string;
  visibilityStatus?: string;
};

type UploadScope = "coach_gallery" | "coach_hero" | "coach_video";

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

async function uploadViaPresign(input: { file: File; scope: UploadScope }) {
  const presign = (await postJson("/api/uploads/presign", {
    scope: input.scope,
    fileName: input.file.name,
    contentType: input.file.type,
    sizeBytes: input.file.size,
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

async function deleteUploadedObject(url: string) {
  await postJson("/api/uploads/delete", { url });
}

function fieldInputClass(invalid = false) {
  return `rounded-xl border px-3 py-2 ${invalid ? "border-red-300 bg-red-50/40" : "border-black/10"}`;
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
      <p className="font-semibold text-zinc-900">{label}</p>
      <p className="mt-1 text-zinc-600">{hint}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 font-semibold text-zinc-900 disabled:opacity-60"
        >
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
}: {
  initialProfile: EditorProfile | null;
  wizardMode?: boolean;
}) {
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
  const [form, setForm] = useState({
    name: initialProfile?.name || "",
    headline: initialProfile?.headline || "",
    bio: initialProfile?.bio || "",
    specialtiesText: initialProfile?.specialtiesText || "",
    languagesText: initialProfile?.languagesText || "",
    city: initialProfile?.location?.city || "",
    province: initialProfile?.location?.province || "",
    heroImageUrl: initialProfile?.heroImageUrl || "",
    videoPresentationUrl: initialProfile?.videoPresentationUrl || "",
    basePriceEur: String(initialProfile?.pricing?.basePriceEur ?? ""),
    pricingDetailsHtml: initialProfile?.pricing?.detailsHtml || "",
    web: initialProfile?.links?.find((l) => l.type === "web")?.value || "",
    linkedin: initialProfile?.links?.find((l) => l.type === "linkedin")?.value || "",
    whatsapp: initialProfile?.links?.find((l) => l.type === "whatsapp")?.value || "",
    email: initialProfile?.links?.find((l) => l.type === "email")?.value || "",
    phone: initialProfile?.links?.find((l) => l.type === "phone")?.value || "",
    galleryUrls: (initialProfile?.galleryAssets || []).map((a) => a.url).join("\n"),
    categorySlugs: (initialProfile?.categories || [])
      .map((item) => item.category?.slug || "")
      .filter(Boolean)
      .slice(0, 12),
    modeOnline: (initialProfile?.sessionModes || []).some((m) => m.mode === "online"),
    modePresencial: (initialProfile?.sessionModes || []).some((m) => m.mode === "presencial"),
  });

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }

  const steps = useMemo(
    () => [
      { label: "Datos basicos", done: Boolean(form.name.trim() && form.bio.trim() && form.categorySlugs.length) },
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
        bio: !form.bio.trim() ? "La bio es obligatoria." : "",
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
      name: form.name,
      headline: form.headline || null,
      bio: form.bio || null,
      specialtiesText: form.specialtiesText || null,
      languagesText: form.languagesText || null,
      heroImageUrl: form.heroImageUrl || null,
      videoPresentationUrl: form.videoPresentationUrl || null,
      location: form.city ? { city: form.city, province: form.province || null, country: "Espana" } : null,
      sessionModes,
      pricing: {
        basePriceEur: form.basePriceEur ? Number(form.basePriceEur) : null,
        detailsHtml: form.pricingDetailsHtml || null,
      },
      links: {
        web: form.web || null,
        linkedin: form.linkedin || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        phone: form.phone || null,
      },
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
          setStatus({ type: "error", text: "Completa todos los pasos obligatorios del wizard antes de publicar." });
          return;
        }
        await postJson("/api/coach-profile/save", buildPayload());
        setIsDirty(false);
        await postJson("/api/coach-profile/publish", {});
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
      const uploaded = await uploadViaPresign({ file, scope: "coach_hero" });
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
      const uploaded = await uploadViaPresign({ file, scope: "coach_video" });
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
        const uploaded = await uploadViaPresign({ file, scope: "coach_gallery" });
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
    setField("categorySlugs", Array.from(current).slice(0, 12));
  }

  function removeHero() {
    const url = form.heroImageUrl.trim();
    if (!url) return;
    startTransition(async () => {
      try {
        await deleteUploadedObject(url);
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
        await deleteUploadedObject(url);
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
        await deleteUploadedObject(url);
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
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Wizard de onboarding</p>
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
            </button>
            {autoSavingStep !== null ? <span className="self-center text-sm text-zinc-600">Autoguardando paso {autoSavingStep + 1}...</span> : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Editor de perfil coach</h2>
            <p className="mt-1 text-sm text-zinc-600">Guarda tus datos y publica cuando tengas membresia activa.</p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1">
              Estado: {initialProfile?.profileStatus || "draft"}
            </span>
            <span className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1">
              Visibilidad: {initialProfile?.visibilityStatus || "inactive"}
            </span>
          </div>
        </div>
      </section>

      {showStep(0) ? (
        <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-black tracking-tight text-zinc-950">Paso 1 · Datos basicos</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Nombre visible
              <input value={form.name} onChange={(e) => setField("name", e.target.value)} className={fieldInputClass(showValidation && !!currentStepErrors.name)} />
              {showValidation && currentStepErrors.name ? <span className="text-xs text-red-600">{currentStepErrors.name}</span> : null}
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Titular / headline
              <input value={form.headline} onChange={(e) => setField("headline", e.target.value)} className={fieldInputClass()} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800 md:col-span-2">
              Sobre mi (bio)
              <textarea value={form.bio} onChange={(e) => setField("bio", e.target.value)} rows={5} className={fieldInputClass(showValidation && !!currentStepErrors.bio)} />
              {showValidation && currentStepErrors.bio ? <span className="text-xs text-red-600">{currentStepErrors.bio}</span> : null}
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Especialidades (texto)
              <input
                value={form.specialtiesText}
                onChange={(e) => setField("specialtiesText", e.target.value)}
                className={fieldInputClass()}
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Idiomas (texto)
              <input
                value={form.languagesText}
                onChange={(e) => setField("languagesText", e.target.value)}
                className={fieldInputClass()}
              />
            </label>
            <div className="grid gap-2 text-sm font-medium text-zinc-800 md:col-span-2">
              <span>Categorias del coach (SEO estructurado)</span>
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
                        disabled={!checked && form.categorySlugs.length >= 12}
                      />
                      <span>{category.name}</span>
                    </label>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-normal text-zinc-500">Hasta 12 categorias por perfil.</span>
                <span className="text-xs font-semibold text-zinc-700">{form.categorySlugs.length}/12</span>
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
              />
              {showValidation && currentStepErrors.basePriceEur ? (
                <span className="text-xs text-red-600">{currentStepErrors.basePriceEur}</span>
              ) : null}
            </label>
            <div />
            <label className="grid gap-1 text-sm font-medium text-zinc-800 md:col-span-2">
              Detalle de precios / condiciones
              <textarea
                value={form.pricingDetailsHtml}
                onChange={(e) => setField("pricingDetailsHtml", e.target.value)}
                rows={4}
                className={fieldInputClass()}
              />
            </label>
          </div>
        </section>
      ) : null}

      {showStep(3) ? (
        <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-black tracking-tight text-zinc-950">Paso 4 · Contacto y media</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Web
              <input value={form.web} onChange={(e) => setField("web", e.target.value)} className={fieldInputClass(showValidation && !!currentStepErrors.contact)} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              LinkedIn
              <input value={form.linkedin} onChange={(e) => setField("linkedin", e.target.value)} className={fieldInputClass()} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              WhatsApp
              <input value={form.whatsapp} onChange={(e) => setField("whatsapp", e.target.value)} className={fieldInputClass(showValidation && !!currentStepErrors.contact)} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Email de contacto
              <input value={form.email} onChange={(e) => setField("email", e.target.value)} className={fieldInputClass(showValidation && !!currentStepErrors.contact)} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Telefono
              <input value={form.phone} onChange={(e) => setField("phone", e.target.value)} className={fieldInputClass()} />
            </label>
            {showValidation && currentStepErrors.contact ? (
              <p className="md:col-span-2 text-xs text-red-600">{currentStepErrors.contact}</p>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4">
            <UploadDropzone
              label="Imagen principal (hero)"
              hint="Imagen JPG, PNG o WEBP. Se sube a tu bucket publico."
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
              hint="MP4 o WEBM. El endpoint permite videos de coach."
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
              hint="Puedes arrastrar varias imagenes. Maximo 8 elementos."
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

      <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending || uploading !== null}
            onClick={onSave}
            className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Guardando..." : "Guardar perfil"}
          </button>
          <button
            type="button"
            disabled={pending || uploading !== null || (wizardMode && !allDone)}
            onClick={onPublish}
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 disabled:opacity-60"
          >
            Guardar y publicar
          </button>
          {wizardMode && !allDone ? (
            <span className="self-center text-sm text-zinc-600">
              Completa todos los pasos del wizard para habilitar la publicacion.
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
