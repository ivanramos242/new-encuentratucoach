"use client";

import { useEffect, useMemo, useState } from "react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  ok?: boolean;
  notifications?: NotificationItem[];
  unreadCount?: number;
  message?: string;
};

type PollResponse = {
  ok?: boolean;
  items?: NotificationItem[];
  pollIntervalMs?: number;
};

function mergeNotifications(existing: NotificationItem[], incoming: NotificationItem[]) {
  const map = new Map(existing.map((item) => [item.id, item]));
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function AccountNotificationCenter() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [pollMs, setPollMs] = useState(300_000);

  const unread = useMemo(() => items.filter((item) => !item.isRead).length, [items]);
  const latestTimestamp = useMemo(() => items[0]?.createdAt ?? null, [items]);

  async function loadAll() {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as NotificationsResponse;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "No se pudieron cargar las notificaciones.");
      }
      setItems(payload.notifications ?? []);
      setFeedback("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudieron cargar las notificaciones.");
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.message || "No se pudo marcar como leida.");
      setItems((prev) => prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)));
      setFeedback("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo marcar como leida.");
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch("/api/notifications/read-all", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.message || "No se pudieron marcar como leidas.");
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setFeedback("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudieron marcar como leidas.");
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    let timeoutId: number | null = null;
    let stopped = false;

    const poll = async () => {
      if (stopped) return;
      try {
        const query = latestTimestamp ? `?since=${encodeURIComponent(latestTimestamp)}` : "";
        const response = await fetch(`/api/notifications/poll${query}`, { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as PollResponse;
        if (response.ok && payload.ok) {
          const incoming = payload.items ?? [];
          if (incoming.length) {
            setItems((prev) => mergeNotifications(prev, incoming));
          }
          if (typeof payload.pollIntervalMs === "number" && payload.pollIntervalMs > 0) {
            setPollMs(payload.pollIntervalMs);
          }
        }
      } catch {
        // silent polling errors
      } finally {
        if (!stopped) {
          const jitter = Math.round(Math.max(15_000, pollMs) * Math.random() * 0.1);
          timeoutId = window.setTimeout(poll, Math.max(15_000, pollMs) + jitter);
        }
      }
    };

    timeoutId = window.setTimeout(poll, Math.max(15_000, pollMs));
    return () => {
      stopped = true;
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [latestTimestamp, pollMs]);

  return (
    <section className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Centro de notificaciones</h2>
          <p className="mt-1 text-sm text-zinc-700">Notificaciones in-app + email. Actualizacion automatica por polling.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700">{items.length} total</span>
          <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-cyan-800">{unread} sin leer</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={loadAll}
          className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          Recargar
        </button>
        <button
          type="button"
          onClick={markAllAsRead}
          disabled={!unread}
          className="rounded-xl bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Marcar todas como leidas
        </button>
      </div>

      {feedback ? <p className="text-sm text-red-600">{feedback}</p> : null}

      {loading ? (
        <p className="text-sm text-zinc-600">Cargando notificaciones...</p>
      ) : items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl border p-4 ${item.isRead ? "border-black/10 bg-zinc-50" : "border-cyan-200 bg-cyan-50"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{item.type}</p>
                  <h3 className="mt-1 text-base font-black tracking-tight text-zinc-950">{item.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isRead ? "bg-zinc-100 text-zinc-700" : "bg-cyan-100 text-cyan-800"}`}
                  >
                    {item.isRead ? "Leida" : "Nueva"}
                  </span>
                  {!item.isRead ? (
                    <button
                      type="button"
                      onClick={() => markAsRead(item.id)}
                      className="rounded-xl border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Marcar leida
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-700">{item.body}</p>
              <p className="mt-3 text-xs text-zinc-500">{new Date(item.createdAt).toLocaleString("es-ES")}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-600">No tienes notificaciones por ahora.</p>
      )}
    </section>
  );
}

