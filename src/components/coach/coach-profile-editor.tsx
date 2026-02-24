"use client";

import { useState, useTransition } from "react";

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
  galleryAssets?: Array<{ url: string }>;
  sessionModes?: Array<{ mode: "online" | "presencial" }>;
  profileStatus?: string;
  visibilityStatus?: string;
};

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

export function CoachProfileEditor({ initialProfile }: { initialProfile: EditorProfile | null }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; text: string }>({ type: "idle", text: "" });
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
    modeOnline: (initialProfile?.sessionModes || []).some((m) => m.mode === "online"),
    modePresencial: (initialProfile?.sessionModes || []).some((m) => m.mode === "presencial"),
  });

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
      location: form.city ? { city: form.city, province: form.province || null, country: "España" } : null,
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
        await postJson("/api/coach-profile/save", buildPayload());
        await postJson("/api/coach-profile/publish", {});
        setStatus({ type: "ok", text: "Perfil publicado correctamente." });
      } catch (error) {
        setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo publicar el perfil." });
      }
    });
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Editor de perfil coach</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Guarda los datos principales y publica cuando tengas membresía activa.
            </p>
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

      <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-zinc-800">
            Nombre visible
            <input value={form.name} onChange={(e) => setField("name", e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-800">
            Titular / headline
            <input value={form.headline} onChange={(e) => setField("headline", e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-800 md:col-span-2">
            Sobre mí (bio)
            <textarea value={form.bio} onChange={(e) => setField("bio", e.target.value)} rows={5} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-800">
            Especialidades (texto)
            <input value={form.specialtiesText} onChange={(e) => setField("specialtiesText", e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-800">
            Idiomas (texto)
            <input value={form.languagesText} onChange={(e) => setField("languagesText", e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-800">
            Ciudad
            <input value={form.city} onChange={(e) => setField("city", e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-800">
            Provincia
            <input value={form.province} onChange={(e) => setField("province", e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-800">
            Precio base (€)
            <input type="number" value={form.basePriceEur} onChange={(e) => setField("basePriceEur", e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-800 md:col-span-2">
            Detalle de precios / condiciones
            <textarea value={form.pricingDetailsHtml} onChange={(e) => setField("pricingDetailsHtml", e.target.value)} rows={4} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-zinc-800">
            URL imagen principal (hero)
            <input value={form.heroImageUrl} onChange={(e) => setField("heroImageUrl", e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-800">
            URL vídeo presentación
            <input value={form.videoPresentationUrl} onChange={(e) => setField("videoPresentationUrl", e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-800">
            Web
            <input value={form.web} onChange={(e) => setField("web", e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-800">
            LinkedIn
            <input value={form.linkedin} onChange={(e) => setField("linkedin", e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-800">
            WhatsApp
            <input value={form.whatsapp} onChange={(e) => setField("whatsapp", e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-800">
            Email de contacto
            <input value={form.email} onChange={(e) => setField("email", e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-zinc-800">
            Teléfono
            <input value={form.phone} onChange={(e) => setField("phone", e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
          <div className="grid gap-2 text-sm font-medium text-zinc-800">
            Modalidad
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={form.modeOnline} onChange={(e) => setField("modeOnline", e.target.checked)} />
              Online
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={form.modePresencial} onChange={(e) => setField("modePresencial", e.target.checked)} />
              Presencial
            </label>
          </div>
          <label className="grid gap-1 text-sm font-medium text-zinc-800 md:col-span-2">
            Galería (1 URL por línea)
            <textarea value={form.galleryUrls} onChange={(e) => setField("galleryUrls", e.target.value)} rows={5} className="rounded-xl border border-black/10 px-3 py-2" />
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-cyan-300 bg-cyan-50 p-4 text-sm text-cyan-950">
          <p className="font-semibold">Subidas (MinIO / S3) preparadas</p>
          <p className="mt-1">
            Puedes usar <code>/api/uploads/presign</code> para obtener una URL firmada y pegar la URL resultante en los
            campos de imagen/galería. (Integración drag&drop se añade en el siguiente sprint.)
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={onSave}
            className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Guardando..." : "Guardar perfil"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onPublish}
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 disabled:opacity-60"
          >
            Guardar y publicar
          </button>
        </div>
        {status.text ? (
          <p className={`mt-4 text-sm ${status.type === "error" ? "text-red-600" : "text-emerald-700"}`}>{status.text}</p>
        ) : null}
      </section>
    </div>
  );
}

