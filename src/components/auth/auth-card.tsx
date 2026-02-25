"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type ApiResponse = {
  ok?: boolean;
  message?: string;
  debugResetUrl?: string;
  user?: { role?: "admin" | "coach" | "client" };
};

function StatusLine({ type, text }: { type: "idle" | "ok" | "error"; text: string }) {
  if (!text) return null;
  return <p className={`mt-3 text-sm ${type === "error" ? "text-red-600" : "text-emerald-700"}`}>{text}</p>;
}

function InputWithIcon({
  iconClass,
  className,
  trailing,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { iconClass: string; trailing?: React.ReactNode }) {
  return (
    <div className="relative">
      <i className={`${iconClass} pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400`} aria-hidden="true" />
      <input
        {...props}
        className={`w-full rounded-2xl border border-black/10 bg-white py-3 pl-10 pr-12 text-[15px] outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 ${className || ""}`}
      />
      {trailing ? <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div> : null}
    </div>
  );
}

function PasswordInput({
  name,
  required = true,
  minLength = 8,
  placeholder,
}: {
  name: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <InputWithIcon
      iconClass="fa-solid fa-lock"
      type={show ? "text" : "password"}
      name={name}
      required={required}
      minLength={minLength}
      placeholder={placeholder}
      trailing={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100"
          aria-label={show ? "Ocultar contraseÃ±a" : "Mostrar contraseÃ±a"}
        >
          <i className={`fa-solid ${show ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true" />
        </button>
      }
    />
  );
}

async function postJson<T extends Record<string, unknown>>(url: string, payload: T): Promise<ApiResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  let json: ApiResponse | null = null;
  try {
    json = (await res.json()) as ApiResponse;
  } catch {
    throw new Error(`Error del servidor (${res.status}). Revisa los logs.`);
  }
  if (!res.ok || !json.ok) throw new Error(json.message || "Error inesperado");
  return json;
}

function AuthSplitShell({
  title,
  subtitle,
  userCount,
  rightCard,
  role,
}: {
  title: string;
  subtitle: string;
  userCount: number;
  rightCard: React.ReactNode;
  role: "login" | "coach" | "client";
}) {
  const ctaLabel = role === "coach" ? "Soy coach" : "Ver directorio";
  const ctaHref = role === "coach" ? "/membresia" : "/coaches";
  const authTitle =
    role === "login" ? "Acceso a tu cuenta" : role === "coach" ? "Alta de coach" : "Crear cuenta";

  return (
    <div className="rounded-3xl border border-black/5 bg-[radial-gradient(circle_at_10%_10%,rgba(16,166,187,.14),transparent_45%),radial-gradient(circle_at_90%_90%,rgba(41,170,128,.14),transparent_45%),#f6f8fb] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(320px,1fr)_minmax(0,650px)] lg:items-start">
        <section>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-2 text-sm text-zinc-600">
            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-[0_0_0_4px_rgba(16,166,187,.14)]" />
            {authTitle}
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">{subtitle}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-black/10 bg-white/90 p-4 shadow-sm">
              <p className="text-sm text-zinc-600">Usuarios registrados</p>
              <p className="mt-1 text-3xl font-black tracking-tight text-zinc-950">
                <span className="mr-1 bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">+</span>
                {new Intl.NumberFormat("es-ES").format(userCount)}
              </p>
            </div>
            <div className="rounded-3xl border border-black/10 bg-white/70 p-4">
              <p className="text-sm text-zinc-600">Coaches online y presencial</p>
              <p className="mt-1 text-3xl font-black tracking-tight text-zinc-950">EspaÃ±a</p>
            </div>
          </div>

          <ul className="mt-5 grid gap-3 text-zinc-600">
            {[
              "Perfiles verificados y reseÃ±as",
              "Filtros por ciudad, especialidad y precio",
              "MensajerÃ­a directa",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
            <Link className="border-b border-zinc-300 hover:border-zinc-500 hover:text-zinc-900" href="/coaches">
              Ver directorio
            </Link>
            <span aria-hidden="true">Â·</span>
            <Link className="border-b border-zinc-300 hover:border-zinc-500 hover:text-zinc-900" href="/pregunta-a-un-coach">
              Pregunta a un coach
            </Link>
            <span aria-hidden="true">Â·</span>
            <Link className="border-b border-zinc-300 hover:border-zinc-500 hover:text-zinc-900" href={ctaHref}>
              {ctaLabel}
            </Link>
          </div>
        </section>

        <div className="w-full max-w-[650px] justify-self-end rounded-3xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(16,24,40,.10)]">
          {rightCard}
        </div>
      </div>
    </div>
  );
}

function CardHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-black/10 bg-gradient-to-b from-cyan-50/80 to-white px-5 py-4">
      <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-200 bg-cyan-50 text-zinc-900">
        <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden="true">
          <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M20 22a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className="text-xl font-black tracking-tight text-zinc-950">{title}</p>
        <p className="text-sm text-zinc-600">{hint}</p>
      </div>
    </div>
  );
}

function GoogleButtonPlaceholder({ mode }: { mode: "login" | "register" }) {
  return (
    <button
      type="button"
      disabled
      className="mx-auto inline-flex w-full max-w-sm items-center justify-center gap-3 rounded-2xl border border-black/10 bg-zinc-950 px-4 py-3 font-semibold text-white opacity-95"
      aria-disabled="true"
      title="Lo configuraremos mÃ¡s adelante"
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-zinc-900">
        <i className="fa-brands fa-google" aria-hidden="true" />
      </span>
      {mode === "login" ? "Iniciar sesiÃ³n con Google" : "Registrarme con Google"}
      <span className="text-xs font-medium text-zinc-300">(prÃ³ximamente)</span>
    </button>
  );
}

function DividerOr() {
  return (
    <div className="relative my-4 h-px bg-black/10">
      <span className="absolute left-1/2 top-1/2 grid h-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white px-2 text-xs text-zinc-500">
        o
      </span>
    </div>
  );
}

function ForgotPasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; text: string }>({ type: "idle", text: "" });
  const [debugLink, setDebugLink] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999999] grid place-items-center p-4">
      <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar modal" />
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-black/10 bg-gradient-to-b from-cyan-50/80 to-white px-5 py-4">
          <div>
            <p className="text-lg font-black tracking-tight text-zinc-950">Restablecer contraseÃ±a</p>
            <p className="mt-1 text-sm text-zinc-600">Introduce tu correo y te enviaremos un enlace para recuperar el acceso.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl border border-black/10 bg-white text-zinc-700 hover:bg-zinc-50"
            aria-label="Cerrar"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <form
          className="p-5"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const email = String(formData.get("email") || "").trim();
            if (!email) {
              setStatus({ type: "error", text: "Introduce tu correo electrÃ³nico." });
              return;
            }
            startTransition(async () => {
              setStatus({ type: "idle", text: "" });
              setDebugLink(null);
              try {
                const json = await postJson("/api/auth/password/forgot", { email });
                setStatus({
                  type: "ok",
                  text: json.message || "Si el email existe, recibirÃ¡s instrucciones para recuperar la contraseÃ±a.",
                });
                setDebugLink(json.debugResetUrl || null);
              } catch (error) {
                setStatus({
                  type: "error",
                  text: error instanceof Error ? error.message : "No se pudo procesar la solicitud.",
                });
              }
            });
          }}
        >
          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            Correo electrÃ³nico
            <InputWithIcon iconClass="fa-solid fa-envelope" type="email" name="email" required placeholder="tu@email.com" />
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Enviando..." : "Enviar enlace"}
            </button>
          </div>
          <StatusLine type={status.type} text={status.text} />
          {debugLink ? (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Enlace de prueba:{" "}
              <a href={debugLink} className="font-semibold underline">
                {debugLink}
              </a>
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}

export function LoginCard({ returnTo = "/mi-cuenta", userCount = 602 }: { returnTo?: string; userCount?: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; text: string }>({ type: "idle", text: "" });
  const [forgotOpen, setForgotOpen] = useState(false);

  const title = "Iniciar sesiÃ³n";
  const subtitle = "Accede para guardar coaches, enviar mensajes y participar en â€œPregunta a un coachâ€.";

  const rightCard = (
    <>
      <CardHeader
        title="Iniciar sesiÃ³n"
        hint="Inicia sesiÃ³n con Google (recomendado) o introduce tus datos para continuar."
      />
      <div className="px-5 py-5">
        <div className="text-center">
          <GoogleButtonPlaceholder mode="login" />
        </div>
        <DividerOr />

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const email = String(formData.get("email") || "");
            const password = String(formData.get("password") || "");

            startTransition(async () => {
              setStatus({ type: "idle", text: "" });
              try {
                const json = await postJson("/api/auth/login", { email, password });
                setStatus({ type: "ok", text: "SesiÃ³n iniciada. Redirigiendo..." });
                router.push(returnTo || (json.user?.role === "admin" ? "/admin" : "/mi-cuenta"));
                router.refresh();
              } catch (error) {
                setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo iniciar sesiÃ³n" });
              }
            });
          }}
          className="grid gap-4"
        >
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-700">Correo electrÃ³nico</label>
            <InputWithIcon iconClass="fa-solid fa-envelope" type="email" name="email" required placeholder="tu@email.com" />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-700">ContraseÃ±a</label>
            <PasswordInput name="password" placeholder="Tu contraseÃ±a" />
          </div>

          <label className="mt-1 inline-flex items-center gap-2 text-sm text-zinc-600">
            <input type="checkbox" disabled className="h-4 w-4 rounded border-black/20" />
            AcuÃ©rdate de mÃ­ (prÃ³ximamente)
          </label>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-base font-semibold text-zinc-900 shadow-sm transition hover:bg-cyan-50 disabled:opacity-60"
          >
            {pending ? "Entrando..." : "Iniciar sesiÃ³n"}
          </button>

          <p className="mt-1 text-center text-sm text-zinc-600">
            No tienes una cuenta?{" "}
            <Link href="/registro/cliente" className="font-semibold text-cyan-700 hover:text-cyan-800">
              Registrarse
            </Link>
          </p>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="border-b border-zinc-300 text-sm text-zinc-600 hover:border-zinc-500 hover:text-zinc-900"
            >
              He olvidado la contraseÃ±a
            </button>
          </div>

          <StatusLine type={status.type} text={status.text} />
          {status.type === "error" && /restablecer tu contrase/i.test(status.text) ? (
            <p className="text-sm text-zinc-700">
              Ve a{" "}
              <button type="button" onClick={() => setForgotOpen(true)} className="font-semibold text-cyan-700 underline">
                Recuperar contraseÃ±a
              </button>{" "}
              y usa ese mismo email.
            </p>
          ) : null}
        </form>
      </div>
      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );

  return <AuthSplitShell title={title} subtitle={subtitle} userCount={userCount} rightCard={rightCard} role="login" />;
}

export function RegisterCard({
  role,
  userCount = 602,
}: {
  role: "coach" | "client";
  userCount?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; text: string }>({ type: "idle", text: "" });

  const content = useMemo(() => {
    if (role === "coach") {
      return {
        title: "Crear cuenta de coach",
        subtitle: "Crea tu cuenta (empieza como cliente) y activa la membresia para publicar tu perfil como coach.",
        cardTitle: "Alta de coach",
        cardHint: "Crearas una cuenta unica. Tras el pago de la membresia, tu cuenta se activara como coach.",
        redirect: "/membresia",
      };
    }
    return {
      title: "Crear cuenta",
      subtitle: "Crea tu cuenta para guardar coaches, enviar mensajes y participar en â€œPregunta a un coachâ€.",
      cardTitle: "Registro de cliente",
      cardHint: "Google estara disponible mas adelante. Mientras tanto, completa tus datos para continuar.",
      redirect: "/mi-cuenta/cliente",
    };
  }, [role]);

  const rightCard = (
    <>
      <CardHeader title={content.cardTitle} hint={content.cardHint} />
      <div className="px-5 py-5">
        <div className="text-center">
          <GoogleButtonPlaceholder mode="register" />
        </div>
        <DividerOr />

        <form
          onSubmit={(event) => {
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
                router.push(content.redirect);
                router.refresh();
              } catch (error) {
                setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo crear la cuenta" });
              }
            });
          }}
          className="grid gap-4"
        >
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-700">Nombre visible</label>
            <InputWithIcon iconClass="fa-solid fa-user" type="text" name="displayName" required minLength={2} placeholder="Tu nombre" />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-700">Correo electrÃ³nico</label>
            <InputWithIcon iconClass="fa-solid fa-envelope" type="email" name="email" required placeholder="tu@email.com" />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-700">ContraseÃ±a</label>
            <PasswordInput name="password" placeholder="MÃ­nimo 8 caracteres" />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-base font-semibold text-zinc-900 shadow-sm transition hover:bg-cyan-50 disabled:opacity-60"
          >
            {pending ? "Creando..." : role === "coach" ? "Crear cuenta y continuar" : "Crear cuenta"}
          </button>

          <p className="mt-1 text-center text-sm text-zinc-600">
            Â¿Ya tienes cuenta?{" "}
            <Link href="/iniciar-sesion" className="font-semibold text-cyan-700 hover:text-cyan-800">
              Iniciar sesiÃ³n
            </Link>
          </p>

          <StatusLine type={status.type} text={status.text} />
        </form>
      </div>
    </>
  );

  return <AuthSplitShell title={content.title} subtitle={content.subtitle} userCount={userCount} rightCard={rightCard} role={role} />;
}

function SimpleCardShell({
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

export function ForgotPasswordCard() {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; text: string }>({ type: "idle", text: "" });
  const [debugLink, setDebugLink] = useState<string | null>(null);

  return (
    <SimpleCardShell title="Recuperar contraseÃ±a" subtitle="Te enviaremos un enlace para restablecer tu contraseÃ±a.">
      <form
        onSubmit={(event) => {
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
        }}
        className="grid gap-4"
      >
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          Email
          <InputWithIcon iconClass="fa-solid fa-envelope" type="email" name="email" required />
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
            Enlace de prueba disponible:{" "}
            <a href={debugLink} className="font-semibold underline">
              {debugLink}
            </a>
          </p>
        ) : null}
      </form>
    </SimpleCardShell>
  );
}

export function ResetPasswordCard({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; text: string }>({ type: "idle", text: "" });

  return (
    <SimpleCardShell title="Restablecer contraseÃ±a" subtitle="Introduce tu nueva contraseÃ±a para completar el acceso a tu cuenta.">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const password = String(formData.get("password") || "");
          const passwordConfirm = String(formData.get("passwordConfirm") || "");

          if (password !== passwordConfirm) {
            setStatus({ type: "error", text: "Las contraseÃ±as no coinciden." });
            return;
          }

          startTransition(async () => {
            setStatus({ type: "idle", text: "" });
            try {
              await postJson("/api/auth/password/reset", { token, password });
              setStatus({ type: "ok", text: "ContraseÃ±a actualizada. Redirigiendo a login..." });
              setTimeout(() => {
                router.push("/iniciar-sesion");
                router.refresh();
              }, 800);
            } catch (error) {
              setStatus({
                type: "error",
                text: error instanceof Error ? error.message : "No se pudo restablecer la contraseÃ±a",
              });
            }
          });
        }}
        className="grid gap-4"
      >
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          Nueva contraseÃ±a
          <PasswordInput name="password" placeholder="Nueva contraseÃ±a" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          Repite la contraseÃ±a
          <PasswordInput name="passwordConfirm" placeholder="Repite la contraseÃ±a" />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "Actualizando..." : "Actualizar contraseÃ±a"}
        </button>
        <StatusLine type={status.type} text={status.text} />
      </form>
    </SimpleCardShell>
  );
}


