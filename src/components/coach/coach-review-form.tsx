"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  coachId: string;
  coachSlug: string;
  coachName: string;
  isAuthenticated: boolean;
  isOwnCoachProfile: boolean;
};

type FormState = {
  kind: "idle" | "success" | "error";
  message: string;
};

export function CoachReviewForm({ coachId, coachSlug, coachName, isAuthenticated, isOwnCoachProfile }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<FormState>({ kind: "idle", message: "" });

  if (isOwnCoachProfile) {
    return (
      <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
        No puedes dejar una reseña en tu propio perfil.
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginHref = `/iniciar-sesion?${new URLSearchParams({ returnTo: `/coaches/${coachSlug}#resenas` }).toString()}`;
    return (
      <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4">
        <p className="text-sm text-zinc-700">Para dejar una reseña necesitas iniciar sesión.</p>
        <Link
          href={loginHref}
          className="mt-3 inline-flex items-center rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-900"
        >
          Iniciar sesión para reseñar
        </Link>
      </div>
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const rating = Number(fd.get("rating") || 0);
    const body = String(fd.get("body") || "").trim();

    if (!rating || rating < 1 || rating > 5) {
      setState({ kind: "error", message: "Selecciona una valoración de 1 a 5." });
      return;
    }
    if (body.length < 5) {
      setState({ kind: "error", message: "Escribe un comentario breve." });
      return;
    }

    setState({ kind: "idle", message: "" });
    startTransition(async () => {
      try {
        const response = await fetch("/api/reviews/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            coachId,
            rating,
            body,
          }),
        });
        const payload = (await response.json()) as { ok?: boolean; message?: string };
        if (!response.ok || !payload.ok) throw new Error(payload.message || "No se pudo guardar la reseña.");

        setState({ kind: "success", message: payload.message || "Reseña publicada." });
        form.reset();
        router.refresh();
      } catch (error) {
        setState({
          kind: "error",
          message: error instanceof Error ? error.message : "No se pudo guardar la reseña.",
        });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3 rounded-2xl border border-black/10 bg-zinc-50 p-4">
      <div>
        <h3 className="text-base font-black tracking-tight text-zinc-950">Dejar una reseña</h3>
        <p className="mt-1 text-sm text-zinc-700">
          Solo puedes tener una reseña por perfil. Si ya escribiste una para {coachName}, se actualiza.
        </p>
      </div>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        Valoración
        <select
          name="rating"
          defaultValue="5"
          required
          className="rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-cyan-400"
        >
          <option value="5">5 - Excelente</option>
          <option value="4">4 - Muy buena</option>
          <option value="3">3 - Buena</option>
          <option value="2">2 - Mejorable</option>
          <option value="1">1 - Mala</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        Comentario
        <textarea
          name="body"
          rows={4}
          required
          minLength={5}
          maxLength={2000}
          placeholder="Cuenta tu experiencia de forma clara y útil para otras personas."
          className="rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-cyan-400"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Guardando reseña..." : "Publicar reseña"}
      </button>

      {state.message ? (
        <p className={state.kind === "error" ? "text-sm text-red-600" : "text-sm text-emerald-700"}>{state.message}</p>
      ) : null}
    </form>
  );
}
