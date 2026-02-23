import type { NotificationPreferenceRecord } from "@/types/v2";

export function NotificationPreferencesView({
  preferences,
  actorLabel,
}: {
  preferences: NotificationPreferenceRecord[];
  actorLabel: string;
}) {
  const grouped = new Map<string, NotificationPreferenceRecord[]>();
  for (const pref of preferences) {
    const list = grouped.get(pref.type) ?? [];
    list.push(pref);
    grouped.set(pref.type, list);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black tracking-tight text-zinc-950">Preferencias de notificacion</h2>
        <p className="mt-1 text-sm text-zinc-700">
          Configuracion mock V2 para {actorLabel}. En la version final se guardara via <code>/api/notification-preferences</code>.
        </p>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="grid gap-4">
          {[...grouped.entries()].map(([type, entries]) => (
            <div key={type} className="rounded-xl border border-black/10 bg-zinc-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-900">{type}</p>
                <div className="flex items-center gap-2 text-xs">
                  {entries.map((entry) => (
                    <span
                      key={`${entry.type}-${entry.channel}`}
                      className={`rounded-full px-2.5 py-1 font-semibold ${
                        entry.enabled ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {entry.channel}: {entry.enabled ? "ON" : "OFF"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

