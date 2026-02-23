import type { NotificationRecord } from "@/types/v2";

export function NotificationCenterView({
  notifications,
  title = "Centro de notificaciones",
}: {
  notifications: NotificationRecord[];
  title?: string;
}) {
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-tight text-zinc-950">{title}</h2>
            <p className="mt-1 text-sm text-zinc-700">
              In-app + email (casi inmediato por cola de jobs en Postgres). Polling UI cada 5 minutos.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700">{notifications.length} total</span>
            <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-cyan-800">{unreadCount} sin leer</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {notifications.map((item) => (
          <article
            key={item.id}
            className={`rounded-2xl border p-4 shadow-sm ${item.isRead ? "border-black/10 bg-white" : "border-cyan-200 bg-cyan-50"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{item.type}</p>
                <h3 className="mt-1 text-base font-black tracking-tight text-zinc-950">{item.title}</h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`rounded-full px-2.5 py-1 font-semibold ${item.isRead ? "bg-zinc-100 text-zinc-700" : "bg-cyan-100 text-cyan-800"}`}>
                  {item.isRead ? "Leida" : "Nueva"}
                </span>
                <span className="text-zinc-500">{new Date(item.createdAt).toLocaleString("es-ES")}</span>
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-700">{item.body}</p>
            {item.data ? (
              <pre className="mt-3 overflow-x-auto rounded-xl border border-black/10 bg-zinc-50 p-3 text-xs text-zinc-700">
                {JSON.stringify(item.data, null, 2)}
              </pre>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

