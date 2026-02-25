"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ContactCoachForm } from "@/components/forms/contact-coach-form";
import { cn } from "@/lib/utils";

type ModalName = "contact" | "mail" | "share" | null;

type CoachPopupData = {
  id: string;
  name: string;
  heroImageUrl?: string;
  headline?: string;
  links: {
    email?: string;
    whatsapp?: string;
    phone?: string;
    web?: string;
    instagram?: string;
    linkedin?: string;
    facebook?: string;
  };
};

type SvgIconName =
  | "close"
  | "mail"
  | "chat"
  | "wa"
  | "phone"
  | "link"
  | "ig"
  | "in"
  | "fb"
  | "share"
  | "x"
  | "copy";

function Icon({ name, className }: { name: SvgIconName; className?: string }) {
  const props = { className: cn("h-4 w-4", className), viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
  switch (name) {
    case "close":
      return (
        <svg {...props}>
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "mail":
      return (
        <svg {...props}>
          <path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 8l7 5 7-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "chat":
      return (
        <svg {...props}>
          <path d="M20 12a8 8 0 01-8 8H7l-4 2 1.2-3.6A8 8 0 1120 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M8.5 11.5H15M8.5 14.5H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "wa":
      return (
        <svg {...props}>
          <path d="M12 21a9 9 0 10-7.8-4.5L3 21l4.7-1.2A8.9 8.9 0 0012 21z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9.2 8.8c.4-1 1.1-1.1 1.6-.6l1 1.1c.4.5.3 1.2-.2 1.6l-.6.5c.6 1.4 1.6 2.4 3 3l.5-.6c.4-.5 1.1-.6 1.6-.2l1.1 1c.5.5.4 1.2-.6 1.6-1.1.4-3.6.2-6.1-2.3C9 12.4 8.8 10 9.2 8.8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "phone":
      return (
        <svg {...props}>
          <path d="M7 3h3l1 5-2 1c1.2 3 3.6 5.4 6.6 6.6l1-2 5 1v3c0 1.1-.9 2-2 2C10.3 20.2 3.8 13.7 4 5c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "link":
      return (
        <svg {...props}>
          <path d="M10 13a5 5 0 010-7l1-1a5 5 0 117 7l-1 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M14 11a5 5 0 010 7l-1 1a5 5 0 11-7-7l1-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "ig":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.2" cy="6.8" r=".8" fill="currentColor" />
        </svg>
      );
    case "in":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 10.5V16M8 8v.01M12 16v-5.5M16 16v-3a2 2 0 10-4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "fb":
      return (
        <svg {...props}>
          <path d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.2l.8-3H13V9c0-.6.4-1 1-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "share":
      return (
        <svg {...props}>
          <path d="M12 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M7 8l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 14v5a2 2 0 002 2h8a2 2 0 002-2v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "x":
      return (
        <svg {...props}>
          <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "copy":
      return (
        <svg {...props}>
          <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M6 15H5a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    default:
      return null;
  }
}

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

function buildWhatsappHref(phone: string, coachName: string) {
  const text = `Hola ${coachName}, te he visto en encuentratucoach.es y estoy interesado en tus servicios.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function BaseModal({
  open,
  onClose,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/55 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={cn("w-full max-w-2xl rounded-[1.9rem] border border-black/10 bg-white shadow-2xl", className)}>{children}</div>
    </div>
  );
}

function ModalHeader({
  onClose,
  coach,
  title,
  subtitle,
}: {
  onClose: () => void;
  coach: Pick<CoachPopupData, "name" | "heroImageUrl">;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-zinc-100">
          {coach.heroImageUrl ? (
            <Image src={coach.heroImageUrl} alt="" fill className="object-cover" sizes="48px" />
          ) : (
            <div className="h-full w-full bg-zinc-200" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-black tracking-tight text-zinc-900 sm:text-lg">{title}</h3>
          <p className="mt-0.5 text-sm text-zinc-600">{subtitle}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-zinc-50 text-zinc-700 hover:bg-white"
        aria-label="Cerrar"
      >
        <Icon name="close" className="h-5 w-5" />
      </button>
    </div>
  );
}

function ActionButton({
  href,
  onClick,
  icon,
  children,
  tone = "neutral",
}: {
  href?: string;
  onClick?: () => void;
  icon: SvgIconName;
  children: React.ReactNode;
  tone?: "primary" | "soft" | "neutral";
}) {
  const cls = cn(
    "inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition sm:text-base",
    tone === "primary" && "border-blue-500 bg-blue-600 text-white hover:bg-blue-500",
    tone === "soft" && "border-sky-200 bg-sky-100 text-zinc-800 hover:bg-sky-50",
    tone === "neutral" && "border-black/10 bg-white text-zinc-800 hover:bg-zinc-50",
  );

  const content = (
    <>
      <Icon name={icon} className="h-4 w-4" />
      <span>{children}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer noopener" : undefined} className={cls}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cls}>
      {content}
    </button>
  );
}

function SocialPill({ href, icon, children }: { href: string; icon: SvgIconName; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
    >
      <Icon name={icon} className="h-4 w-4 text-zinc-500" />
      <span>{children}</span>
    </a>
  );
}

export function CoachProfileActionPopups({ coach }: { coach: CoachPopupData }) {
  const [modal, setModal] = useState<ModalName>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const wa = digitsPhone(coach.links.whatsapp || coach.links.phone);
  const phone = digitsPhone(coach.links.phone);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    if (modal) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", onEsc);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      window.removeEventListener("keydown", onEsc);
    };
  }, [modal]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const trigger = target.closest("[data-etc-open-popup]") as HTMLElement | null;
      if (!trigger) return;
      const value = trigger.getAttribute("data-etc-open-popup");
      if (value !== "contact" && value !== "mail" && value !== "share") return;
      event.preventDefault();
      setModal(value);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  async function openShare() {
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

  const socialLinks: Array<{ key: string; icon: SvgIconName; label: string; href: string }> = [];
  if (wa) socialLinks.push({ key: "wa", icon: "wa", label: "WhatsApp", href: buildWhatsappHref(wa, coach.name) });
  if (phone) socialLinks.push({ key: "phone", icon: "phone", label: "Llamar", href: `tel:+${phone}` });
  if (coach.links.web) socialLinks.push({ key: "web", icon: "link", label: "Web", href: coach.links.web });
  if (coach.links.instagram) socialLinks.push({ key: "ig", icon: "ig", label: "Instagram", href: coach.links.instagram });
  if (coach.links.linkedin) socialLinks.push({ key: "in", icon: "in", label: "LinkedIn", href: coach.links.linkedin });
  if (coach.links.facebook) socialLinks.push({ key: "fb", icon: "fb", label: "Facebook", href: coach.links.facebook });

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setModal("contact")}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <Icon name="chat" />
          <span>Contacto</span>
        </button>
        <button
          type="button"
          onClick={() => setModal("mail")}
          className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          <Icon name="mail" />
          <span>Enviar email</span>
        </button>
        <button
          type="button"
          onClick={() => void openShare()}
          className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          <Icon name="share" />
          <span>Compartir</span>
        </button>
      </div>

      <BaseModal open={modal === "contact"} onClose={() => setModal(null)}>
        <ModalHeader
          onClose={() => setModal(null)}
          coach={coach}
          title={`Ponte en contacto con ${coach.name}`}
          subtitle="Elige la vía más rápida: mensaje, WhatsApp o email."
        />
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="grid gap-3">
            <ActionButton
              icon="chat"
              tone="primary"
              onClick={() => {
                setModal(null);
                document.getElementById("resenas")?.scrollIntoView({ behavior: "smooth", block: "start" });
                history.replaceState(null, "", "#resenas");
              }}
            >
              Enviar mensaje
            </ActionButton>
            {wa ? (
              <ActionButton icon="wa" tone="soft" href={buildWhatsappHref(wa, coach.name)}>
                Escribir por WhatsApp
              </ActionButton>
            ) : null}
            <ActionButton
              icon="mail"
              onClick={() => {
                setModal("mail");
              }}
            >
              Enviar correo
            </ActionButton>
          </div>

          <div className="my-4 h-px bg-black/10" />

          <div>
            <p className="mb-3 text-sm font-bold text-zinc-700">Redes</p>
            <div className="flex flex-wrap gap-2">
              {socialLinks.length ? socialLinks.map((item) => <SocialPill key={item.key} href={item.href} icon={item.icon}>{item.label}</SocialPill>) : <p className="text-sm text-zinc-500">Este coach no ha añadido enlaces de contacto público.</p>}
            </div>
          </div>
        </div>
      </BaseModal>

      <BaseModal open={modal === "mail"} onClose={() => setModal(null)} className="max-w-3xl">
        <ModalHeader
          onClose={() => setModal(null)}
          coach={coach}
          title={`Enviar email a ${coach.name}`}
          subtitle={coach.headline || "Escribe tu objetivo, situación actual y bloqueo principal."}
        />
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <ContactCoachForm coachId={coach.id} coachName={coach.name} />
        </div>
      </BaseModal>

      <BaseModal open={modal === "share"} onClose={() => setModal(null)}>
        <ModalHeader
          onClose={() => setModal(null)}
          coach={coach}
          title={`Compartir el perfil de ${coach.name}`}
          subtitle="Comparte este perfil o copia un enlace limpio sin parámetros."
        />
        <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2 sm:px-5 sm:pb-5">
          <ActionButton icon="wa" href={`https://wa.me/?text=${encodeURIComponent(`${coach.name} ${cleanUrl()}`)}`}>
            WhatsApp
          </ActionButton>
          <ActionButton icon="in" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cleanUrl())}`}>
            LinkedIn
          </ActionButton>
          <ActionButton icon="fb" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(cleanUrl())}`}>
            Facebook
          </ActionButton>
          <ActionButton icon="x" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(coach.name)}&url=${encodeURIComponent(cleanUrl())}`}>
            X
          </ActionButton>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-zinc-800 hover:bg-sky-100"
            >
              <Icon name="copy" />
              <span>Copiar enlace limpio</span>
            </button>
            {copyStatus ? <p className="mt-2 text-xs font-semibold text-zinc-600">{copyStatus}</p> : null}
          </div>
        </div>
      </BaseModal>
    </>
  );
}
