"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ApiResponse = {
  ok?: boolean;
  message?: string;
  debugResetUrl?: string;
  user?: { role?: "admin" | "coach" | "client" };
};

function CardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-700 sm:text-base">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function StatusLine({ type, text }: { type: "idle" | "ok" | "error"; text: string }) {
  if (!text) return null;
  return (
    <p className={`mt-3 text-sm ${type === "error" ? "text-red-600" : "text-emerald-700"}`}>{text}</p>
  );
}

async function postJson<T extends Record<string, unknown>>(url: string, payload: T): Promise<ApiResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as ApiResponse;
  if (!res.ok || !json.ok) throw new Error(json.message || "Error inesperado");
  return json;
}

export function LoginCard({ returnTo = "/mi-cuenta" }: { returnTo?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; text: string }>({ type: "idle", text: "" });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    startTransition(async () => {
      setStatus({ type: "idle", text: "" });
      try {
        const json = await postJson("/api/auth/login", { email, password });
        setStatus({ type: "ok", text: "Sesión iniciada. Redirigiendo..." });
        router.push(returnTo || (json.user?.role === "admin" ? "/admin" : "/mi-cuenta"));
        router.refresh();
      } catch (error) {
        setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo iniciar sesión" });
      }
    });
  }

  return (
    <CardShell title="Iniciar sesión" subtitle="Accede como coach, cliente o admin con tu email y contraseña.">
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          Email
          <input
            type="email"
            name="email"
            required
            className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          Contraseña
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
        <StatusLine type={status.type} text={status.text} />
      </form>
    </CardShell>
  );
}

export function RegisterCard({ role }: { role: "coach" | "client" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; text: string }>({ type: "idle", text: "" });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      displayName: String(formData.get("displayName") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    };

    startTransition(async () => {
      setStatus({ type: "idle", text: "" });
      try {
        await postJson(`/api/auth/register/${role}`, payload);
        setStatus({ type: "ok", text: "Cuenta creada. Redirigiendo..." });
        router.push(role === "coach" ? "/mi-cuenta/coach" : "/mi-cuenta/cliente");
        router.refresh();
      } catch (error) {
        setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo crear la cuenta" });
      }
    });
  }

  return (
    <CardShell
      title={role === "coach" ? "Crear cuenta de coach" : "Crear cuenta de cliente"}
      subtitle={
        role === "coach"
          ? "Se creará tu usuario y un perfil de coach en borrador para continuar el onboarding."
          : "Crea tu cuenta para guardar reseñas, usar el Q&A y mensajería interna."
      }
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          Nombre visible
          <input
            type="text"
            name="displayName"
            required
            minLength={2}
            className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          Email
          <input
            type="email"
            name="email"
            required
            className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          Contraseña
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "Creando..." : "Crear cuenta"}
        </button>
        <StatusLine type={status.type} text={status.text} />
      </form>
    </CardShell>
  );
}

export function ForgotPasswordCard() {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; text: string }>({ type: "idle", text: "" });
  const [debugLink, setDebugLink] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");

    startTransition(async () => {
      setStatus({ type: "idle", text: "" });
      setDebugLink(null);
      try {
        const json = await postJson("/api/auth/password/forgot", { email });
        setDebugLink(json.debugResetUrl || null);
        setStatus({ type: "ok", text: json.message || "Solicitud procesada." });
      } catch (error) {
        setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo enviar la solicitud" });
      }
    });
  }

  return (
    <CardShell title="Recuperar contraseña" subtitle="Te enviaremos un enlace para restablecer tu contraseña.">
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          Email
          <input
            type="email"
            name="email"
            required
            className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "Enviando..." : "Enviar enlace"}
        </button>
        <StatusLine type={status.type} text={status.text} />
        {debugLink ? (
          <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Entorno sin SMTP o modo desarrollo: enlace de prueba disponible en API. Abre:{" "}
            <a href={debugLink} className="font-semibold underline">
              {debugLink}
            </a>
          </p>
        ) : null}
      </form>
    </CardShell>
  );
}

export function ResetPasswordCard({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; text: string }>({ type: "idle", text: "" });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") || "");
    const passwordConfirm = String(formData.get("passwordConfirm") || "");

    if (password !== passwordConfirm) {
      setStatus({ type: "error", text: "Las contraseñas no coinciden." });
      return;
    }

    startTransition(async () => {
      setStatus({ type: "idle", text: "" });
      try {
        await postJson("/api/auth/password/reset", { token, password });
        setStatus({ type: "ok", text: "Contraseña actualizada. Redirigiendo a login..." });
        setTimeout(() => {
          router.push("/iniciar-sesion");
          router.refresh();
        }, 800);
      } catch (error) {
        setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo restablecer la contraseña" });
      }
    });
  }

  return (
    <CardShell title="Restablecer contraseña" subtitle="Introduce tu nueva contraseña para completar el acceso a tu cuenta.">
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          Nueva contraseña
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          Repite la contraseña
          <input
            type="password"
            name="passwordConfirm"
            required
            minLength={8}
            className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "Actualizando..." : "Actualizar contraseña"}
        </button>
        <StatusLine type={status.type} text={status.text} />
      </form>
    </CardShell>
  );
}

