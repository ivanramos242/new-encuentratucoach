"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { CoachProfileStatus, CoachVisibilityStatus, UserRole } from "@prisma/client";

type OwnerSummary = {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  isActive: boolean;
};

type LegacySummary = {
  wpPostId: string | null;
  wpPostAuthor: string | null;
  wpStatus: string | null;
  sourceEmail: string | null;
  sourceUserIdField: string | null;
  wpPermalink: string | null;
};

export type CoachUserLinkerCoachRow = {
  id: string;
  name: string;
  slug: string;
  profileStatus: CoachProfileStatus;
  visibilityStatus: CoachVisibilityStatus;
  updatedAtIso: string;
  owner: OwnerSummary | null;
  legacy: LegacySummary | null;
  suggestedUserId: string | null;
  suggestedUserLabel: string | null;
};

export type CoachUserLinkerUserOption = {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  isActive: boolean;
  coachProfiles: Array<{ id: string; name: string; slug: string }>;
};

type LinkApiOk = {
  ok: true;
  message: string;
  coach: CoachUserLinkerCoachRow;
};

type LinkApiErr = {
  ok: false;
  message: string;
};

type LinkApiResponse = LinkApiOk | LinkApiErr;
type CoachMutationResponse = LinkApiResponse;
type CreateCoachResponse = LinkApiResponse;
type CreateCoachUserApiOk = {
  ok: true;
  message: string;
  user: CoachUserLinkerUserOption;
  resetEmailDelivered: boolean;
  debugResetUrl?: string;
};
type CreateCoachUserResponse = CreateCoachUserApiOk | LinkApiErr;

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function userLabel(user: CoachUserLinkerUserOption) {
  const name = user.displayName?.trim() || "Sin nombre";
  const coachProfilesCount = user.coachProfiles.length ? ` · ${user.coachProfiles.length} perfil(es)` : "";
  const inactive = user.isActive ? "" : " · inactivo";
  return `${name} (${user.email}) · ${user.role}${coachProfilesCount}${inactive}`;
}

export function CoachUserLinker({
  coaches: initialCoaches,
  users: initialUsers,
}: {
  coaches: CoachUserLinkerCoachRow[];
  users: CoachUserLinkerUserOption[];
}) {
  const [coaches, setCoaches] = useState(initialCoaches);
  const [users, setUsers] = useState(initialUsers);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [createUserEmail, setCreateUserEmail] = useState("");
  const [createUserDisplayName, setCreateUserDisplayName] = useState("");
  const [createUserBusy, setCreateUserBusy] = useState(false);
  const [createUserFeedback, setCreateUserFeedback] = useState<{
    kind: "ok" | "error";
    text: string;
    debugResetUrl?: string;
  } | null>(null);
  const [filterText, setFilterText] = useState("");
  const [onlyUnlinked, setOnlyUnlinked] = useState(true);
  const [draftUserIdByCoachId, setDraftUserIdByCoachId] = useState<Record<string, string>>(
    Object.fromEntries(initialCoaches.map((coach) => [coach.id, coach.owner?.id ?? ""])),
  );
  const [busyCoachId, setBusyCoachId] = useState<string | null>(null);
  const [feedbackByCoachId, setFeedbackByCoachId] = useState<Record<string, { kind: "ok" | "error"; text: string }>>(
    {},
  );

  const total = coaches.length;
  const linked = coaches.filter((c) => Boolean(c.owner)).length;
  const imported = coaches.filter((c) => Boolean(c.legacy)).length;

  function applyCoachMutation(nextCoach: CoachUserLinkerCoachRow) {
    setCoaches((prev) => {
      const exists = prev.some((coach) => coach.id === nextCoach.id);
      if (!exists) return [nextCoach, ...prev];
      return prev.map((coach) => (coach.id === nextCoach.id ? nextCoach : coach));
    });
    setDraftUserIdByCoachId((prev) => ({ ...prev, [nextCoach.id]: nextCoach.owner?.id ?? "" }));
  }

  function addUserOption(nextUser: CoachUserLinkerUserOption) {
    setUsers((prev) => {
      if (prev.some((user) => user.id === nextUser.id)) return prev;
      return [...prev, nextUser].sort((a, b) => a.email.localeCompare(b.email, "es", { sensitivity: "base" }));
    });
  }

  const filtered = coaches.filter((coach) => {
    if (onlyUnlinked && coach.owner) return false;
    const q = filterText.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      coach.name,
      coach.slug,
      coach.owner?.email,
      coach.owner?.displayName ?? "",
      coach.legacy?.sourceEmail ?? "",
      coach.legacy?.wpPostAuthor ?? "",
      coach.legacy?.wpPostId ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  async function submitLink(coachId: string, nextUserId: string | null) {
    setBusyCoachId(coachId);
    setFeedbackByCoachId((prev) => {
      const next = { ...prev };
      delete next[coachId];
      return next;
    });

    try {
      const response = await fetch("/api/admin/coaches/link-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachProfileId: coachId,
          userId: nextUserId,
        }),
      });
      const data = (await response.json()) as CoachMutationResponse;
      if (!response.ok || !data.ok) {
        setFeedbackByCoachId((prev) => ({
          ...prev,
          [coachId]: {
            kind: "error",
            text: data.message || "No se pudo guardar el vínculo.",
          },
        }));
        return;
      }

      applyCoachMutation(data.coach);
      setFeedbackByCoachId((prev) => ({
        ...prev,
        [coachId]: {
          kind: "ok",
          text: data.message,
        },
      }));
    } catch (error) {
      setFeedbackByCoachId((prev) => ({
        ...prev,
        [coachId]: {
          kind: "error",
          text: error instanceof Error ? error.message : "Error de red al guardar el vínculo.",
        },
      }));
    } finally {
      setBusyCoachId(null);
    }
  }

  async function setDraft(coachId: string) {
    setBusyCoachId(coachId);
    setFeedbackByCoachId((prev) => {
      const next = { ...prev };
      delete next[coachId];
      return next;
    });

    try {
      const response = await fetch("/api/admin/coaches/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachProfileId: coachId,
          action: "draft",
        }),
      });
      const data = (await response.json()) as CoachMutationResponse;
      if (!response.ok || !data.ok) {
        setFeedbackByCoachId((prev) => ({
          ...prev,
          [coachId]: {
            kind: "error",
            text: data.message || "No se pudo cambiar el estado.",
          },
        }));
        return;
      }

      applyCoachMutation(data.coach);
      setFeedbackByCoachId((prev) => ({
        ...prev,
        [coachId]: {
          kind: "ok",
          text: data.message,
        },
      }));
    } catch (error) {
      setFeedbackByCoachId((prev) => ({
        ...prev,
        [coachId]: {
          kind: "error",
          text: error instanceof Error ? error.message : "Error de red al cambiar estado.",
        },
      }));
    } finally {
      setBusyCoachId(null);
    }
  }

  async function createCoach(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = createName.trim();
    if (!trimmedName) {
      setCreateFeedback({ kind: "error", text: "El nombre del coach es obligatorio." });
      return;
    }

    setCreateBusy(true);
    setCreateFeedback(null);
    try {
      const response = await fetch("/api/admin/coaches/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          slug: createSlug.trim() || undefined,
        }),
      });
      const data = (await response.json()) as CreateCoachResponse;
      if (!response.ok || !data.ok) {
        setCreateFeedback({
          kind: "error",
          text: data.message || "No se pudo crear el coach.",
        });
        return;
      }

      applyCoachMutation(data.coach);
      setCreateName("");
      setCreateSlug("");
      setCreateFeedback({ kind: "ok", text: data.message });
    } catch (error) {
      setCreateFeedback({
        kind: "error",
        text: error instanceof Error ? error.message : "Error de red al crear el coach.",
      });
    } finally {
      setCreateBusy(false);
    }
  }

  async function createCoachUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = createUserEmail.trim();
    if (!email) {
      setCreateUserFeedback({ kind: "error", text: "El email es obligatorio." });
      return;
    }

    setCreateUserBusy(true);
    setCreateUserFeedback(null);
    try {
      const response = await fetch("/api/admin/coaches/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          displayName: createUserDisplayName.trim() || undefined,
        }),
      });
      const data = (await response.json()) as CreateCoachUserResponse;
      if (!response.ok || !data.ok) {
        setCreateUserFeedback({
          kind: "error",
          text: data.message || "No se pudo crear el usuario coach.",
        });
        return;
      }

      addUserOption(data.user);
      setCreateUserEmail("");
      setCreateUserDisplayName("");
      setCreateUserFeedback({
        kind: "ok",
        text: data.message,
        debugResetUrl: data.debugResetUrl,
      });
    } catch (error) {
      setCreateUserFeedback({
        kind: "error",
        text: error instanceof Error ? error.message : "Error de red al crear el usuario coach.",
      });
    } finally {
      setCreateUserBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black tracking-tight text-zinc-950">Vincular perfil de coach con usuario</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-700">
          Asignación manual de perfiles importados. El endpoint bloquea por seguridad asignaciones a usuarios que ya
          tengan otro perfil de coach distinto.
        </p>

        <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4">
          <h3 className="text-sm font-black tracking-tight text-cyan-950">Crear coach desde cero</h3>
          <p className="mt-1 text-xs leading-5 text-cyan-900">
            Se creara en draft/inactive y sin usuario asociado. Luego puedes vincularlo desde esta misma pantalla.
          </p>

          <form className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => void createCoach(event)}>
            <input
              type="text"
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              placeholder="Nombre del coach"
              className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
              maxLength={160}
              required
            />
            <input
              type="text"
              value={createSlug}
              onChange={(event) => setCreateSlug(event.target.value)}
              placeholder="Slug opcional (ej: ana-perez)"
              className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
              maxLength={180}
            />
            <button
              type="submit"
              disabled={createBusy}
              className="rounded-xl bg-cyan-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {createBusy ? "Creando..." : "Crear coach"}
            </button>
          </form>

          {createFeedback ? (
            <div
              className={
                createFeedback.kind === "ok"
                  ? "mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                  : "mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              }
            >
              {createFeedback.text}
            </div>
          ) : null}
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <h3 className="text-sm font-black tracking-tight text-emerald-950">Crear usuario coach (solo email)</h3>
          <p className="mt-1 text-xs leading-5 text-emerald-900">
            Se crea una cuenta coach con cambio obligatorio de contrasena en el primer acceso (una sola vez).
          </p>

          <form
            className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]"
            onSubmit={(event) => void createCoachUser(event)}
          >
            <input
              type="email"
              value={createUserEmail}
              onChange={(event) => setCreateUserEmail(event.target.value)}
              placeholder="email@dominio.com"
              className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
              maxLength={190}
              required
            />
            <input
              type="text"
              value={createUserDisplayName}
              onChange={(event) => setCreateUserDisplayName(event.target.value)}
              placeholder="Nombre visible (opcional)"
              className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
              maxLength={120}
            />
            <button
              type="submit"
              disabled={createUserBusy}
              className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {createUserBusy ? "Creando..." : "Crear usuario coach"}
            </button>
          </form>

          {createUserFeedback ? (
            <div
              className={
                createUserFeedback.kind === "ok"
                  ? "mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                  : "mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              }
            >
              <div>{createUserFeedback.text}</div>
              {createUserFeedback.debugResetUrl ? (
                <a
                  href={createUserFeedback.debugResetUrl}
                  className="mt-1 inline-flex text-xs font-semibold underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Enlace de recuperacion (dev)
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Coaches</div>
            <div className="mt-1 text-2xl font-black text-zinc-950">{total}</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Vinculados</div>
            <div className="mt-1 text-2xl font-black text-zinc-950">{linked}</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Sin vincular</div>
            <div className="mt-1 text-2xl font-black text-zinc-950">{Math.max(0, total - linked)}</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Importados WP</div>
            <div className="mt-1 text-2xl font-black text-zinc-950">{imported}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Buscar por coach, slug, email legacy o usuario actual..."
            className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
          />
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <input
              type="checkbox"
              checked={onlyUnlinked}
              onChange={(e) => setOnlyUnlinked(e.target.checked)}
              className="h-4 w-4 rounded border-black/20"
            />
            Solo sin vincular
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((coach) => {
          const selectedUserId = draftUserIdByCoachId[coach.id] ?? "";
          const selectedUser = users.find((u) => u.id === selectedUserId) ?? null;
          const isBusy = busyCoachId === coach.id;
          const feedback = feedbackByCoachId[coach.id];
          const canSuggest =
            Boolean(coach.suggestedUserId) &&
            coach.suggestedUserId !== selectedUserId &&
            users.some((u) => u.id === coach.suggestedUserId);

          return (
            <section key={coach.id} className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                <div className="space-y-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black tracking-tight text-zinc-950">{coach.name}</h3>
                      <span className="rounded-full border border-black/10 bg-zinc-50 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                        {coach.profileStatus}
                      </span>
                      <span className="rounded-full border border-black/10 bg-zinc-50 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                        {coach.visibilityStatus}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-zinc-700">
                      slug: <code>{coach.slug}</code> · actualizado: {fmtDate(coach.updatedAtIso)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm text-zinc-800">
                    <div className="font-bold text-zinc-900">Vínculo actual</div>
                    {coach.owner ? (
                      <div className="mt-1">
                        {coach.owner.displayName || "Sin nombre"} ({coach.owner.email}) · {coach.owner.role}
                        {!coach.owner.isActive ? " · inactivo" : ""}
                      </div>
                    ) : (
                      <div className="mt-1 text-amber-700">Sin usuario asignado</div>
                    )}
                  </div>

                  {coach.legacy ? (
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 px-4 py-3 text-sm text-cyan-950">
                      <div className="font-bold">Datos legacy (WP)</div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        {coach.legacy.wpPostId ? <span>post ID: {coach.legacy.wpPostId}</span> : null}
                        {coach.legacy.wpPostAuthor ? <span>post_author: {coach.legacy.wpPostAuthor}</span> : null}
                        {coach.legacy.wpStatus ? <span>status: {coach.legacy.wpStatus}</span> : null}
                        {coach.legacy.sourceUserIdField ? (
                          <span>acf user_id: {coach.legacy.sourceUserIdField}</span>
                        ) : null}
                      </div>
                      {coach.legacy.sourceEmail ? (
                        <div className="mt-1">
                          email origen: <span className="font-semibold">{coach.legacy.sourceEmail}</span>
                        </div>
                      ) : null}
                      {coach.legacy.wpPermalink ? (
                        <a
                          href={coach.legacy.wpPermalink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-xs font-semibold text-cyan-700 underline"
                        >
                          Abrir permalink WP
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3 rounded-2xl border border-black/10 bg-zinc-50 p-4">
                  <label className="grid gap-2 text-sm font-semibold text-zinc-900">
                    Usuario destino
                    <select
                      value={selectedUserId}
                      onChange={(e) =>
                        setDraftUserIdByCoachId((prev) => ({ ...prev, [coach.id]: e.target.value }))
                      }
                      className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Sin asignar</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {userLabel(user)}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedUser ? (
                    <div className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs text-zinc-700">
                      {selectedUser.coachProfiles.length > 0 ? (
                        <div>
                          Este usuario ya tiene perfiles:{" "}
                          {selectedUser.coachProfiles.map((profile) => profile.slug).join(", ")}
                        </div>
                      ) : (
                        <div>Usuario sin perfiles de coach previos.</div>
                      )}
                    </div>
                  ) : null}

                  {canSuggest ? (
                    <button
                      type="button"
                      onClick={() =>
                        setDraftUserIdByCoachId((prev) => ({ ...prev, [coach.id]: coach.suggestedUserId ?? "" }))
                      }
                      className="rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-900"
                    >
                      Usar sugerencia por email ({coach.suggestedUserLabel})
                    </button>
                  ) : coach.suggestedUserId && coach.suggestedUserLabel ? (
                    <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-900">
                      Sugerencia detectada por email: {coach.suggestedUserLabel}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/coaches/${coach.id}`}
                      className="rounded-xl border border-cyan-300 bg-white px-4 py-2 text-sm font-bold text-cyan-900"
                    >
                      Editar perfil
                    </Link>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void submitLink(coach.id, selectedUserId || null)}
                      className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {isBusy ? "Guardando..." : "Guardar vínculo"}
                    </button>
                    {coach.owner ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          if (!window.confirm(`¿Desvincular "${coach.name}" del usuario actual?`)) return;
                          void submitLink(coach.id, null);
                        }}
                        className="rounded-xl border border-black px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
                      >
                        Desvincular
                      </button>
                    ) : null}
                    {!(coach.profileStatus === "draft" && coach.visibilityStatus === "inactive") ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          if (!window.confirm(`¿Pasar "${coach.name}" a draft y ocultarlo del directorio?`)) return;
                          void setDraft(coach.id);
                        }}
                        className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900 disabled:opacity-50"
                      >
                        Pasar a draft
                      </button>
                    ) : null}
                  </div>

                  {feedback ? (
                    <div
                      className={
                        feedback.kind === "ok"
                          ? "rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                          : "rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                      }
                    >
                      {feedback.text}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {!filtered.length ? (
        <div className="rounded-3xl border border-black/10 bg-white p-6 text-sm text-zinc-700 shadow-sm">
          No hay coaches que coincidan con el filtro actual.
        </div>
      ) : null}
    </div>
  );
}
