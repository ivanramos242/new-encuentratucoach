"use client";

import { useEffect, useState } from "react";
import { ContactCoachForm } from "@/components/forms/contact-coach-form";

type ModalName = "contact" | "mail" | "share" | null;

function cleanUrl() {
  if (typeof window === "undefined") return "";
  const u = new URL(window.location.href);
  ["etc_popup", "etc_mail", "etc_err"].forEach((k) => u.searchParams.delete(k));
  u.hash = "";
  return u.toString();
}

function digitsPhone(value?: string) {
  if (!value) return "";
  let v = value.replace(/\D+/g, "");
  if (!v) return "";
  if (!v.startsWith("34")) v = `34${v}`;
  return v;
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-black/10 bg-gradient-to-b from-cyan-50 to-white px-5 py-4">
          <h3 className="text-lg font-black tracking-tight text-zinc-950">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-900"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[80vh] overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function CoachProfileActionPopups({
  coach,
}: {
  coach: {
    id: string;
    name: string;
    links: {
      whatsapp?: string;
      phone?: string;
      web?: string;
      instagram?: string;
      linkedin?: string;
      facebook?: string;
    };
  };
}) {
  const [modal, setModal] = useState<ModalName>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const wa = digitsPhone(coach.links.whatsapp || coach.links.phone);
  const phone = digitsPhone(coach.links.phone);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = modal ? "hidden" : prev;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setModal(null);
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onEsc);
    };
  }, [modal]);

  async function share() {
    const url = cleanUrl();
    const title = `${coach.name} · EncuentraTuCoach`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fallback modal
      }
    }
    setModal("share");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(cleanUrl());
      setCopyStatus("Enlace copiado.");
    } catch {
      setCopyStatus("No se pudo copiar automáticamente.");
    }
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setModal("contact")}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          💬 Contacto
        </button>
        <button
          type="button"
          onClick={() => setModal("mail")}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          ✉️ Enviar email
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          🔗 Compartir
        </button>
      </div>

      <Modal open={modal === "contact"} onClose={() => setModal(null)} title={`Contactar con ${coach.name}`}>
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => setModal("mail")}
            className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-white"
          >
            ✉️ Enviar correo
          </button>
          {wa ? (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
            >
              💚 WhatsApp
            </a>
          ) : null}
          {phone ? (
            <a
              href={`tel:+${phone}`}
              className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2.5 text-center text-sm font-semibold text-zinc-900 hover:bg-white"
            >
              📞 Llamar
            </a>
          ) : null}
          {coach.links.web ? (
            <a href={coach.links.web} target="_blank" rel="noreferrer noopener" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2.5 text-center text-sm font-semibold text-zinc-900 hover:bg-white">
              🌐 Web
            </a>
          ) : null}
        </div>
      </Modal>

      <Modal open={modal === "mail"} onClose={() => setModal(null)} title={`Enviar email a ${coach.name}`}>
        <ContactCoachForm coachId={coach.id} coachName={coach.name} />
      </Modal>

      <Modal open={modal === "share"} onClose={() => setModal(null)} title={`Compartir el perfil de ${coach.name}`}>
        <div className="grid gap-2 sm:grid-cols-2">
          <a href={`https://wa.me/?text=${encodeURIComponent(`${coach.name} ${cleanUrl()}`)}`} target="_blank" rel="noreferrer noopener" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2.5 text-center text-sm font-semibold text-zinc-900 hover:bg-white">WhatsApp</a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cleanUrl())}`} target="_blank" rel="noreferrer noopener" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2.5 text-center text-sm font-semibold text-zinc-900 hover:bg-white">LinkedIn</a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(cleanUrl())}`} target="_blank" rel="noreferrer noopener" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2.5 text-center text-sm font-semibold text-zinc-900 hover:bg-white">Facebook</a>
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(coach.name)}&url=${encodeURIComponent(cleanUrl())}`} target="_blank" rel="noreferrer noopener" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2.5 text-center text-sm font-semibold text-zinc-900 hover:bg-white">X</a>
        </div>
        <button type="button" onClick={() => void copyLink()} className="mt-3 w-full rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-bold text-cyan-900 hover:bg-cyan-100">
          Copiar enlace limpio
        </button>
        {copyStatus ? <p className="mt-2 text-xs font-semibold text-zinc-600">{copyStatus}</p> : null}
      </Modal>
    </>
  );
}
