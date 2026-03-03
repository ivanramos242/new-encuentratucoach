import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import {
  changeUserRoleAction,
  impersonateUserAction,
  setUserStripeCustomerIdAction,
  syncUserStripeSubscriptionAction,
} from "@/app/admin/usuarios/actions";

function pickOne(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseCount(value: string | undefined) {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qRaw = pickOne(params.q) || "";
  const q = qRaw.trim().toLowerCase();
  const updated = pickOne(params.updated) === "1";
  const fromRole = pickOne(params.from);
  const toRole = pickOne(params.to);
  const targetEmail = pickOne(params.email);
  const createdCoach = parseCount(pickOne(params.createdCoach));
  const drafted = parseCount(pickOne(params.drafted));
  const stripeLinked = pickOne(params.stripeLinked) === "1";
  const stripeEmail = pickOne(params.stripeEmail);
  const linkedStripeCustomerId = pickOne(params.stripeCustomerId);
  const stripeSynced = pickOne(params.stripeSynced) === "1";
  const syncedStripeSubscriptionId = pickOne(params.stripeSubscriptionId);
  const stripeSyncSource = pickOne(params.stripeSyncSource);
  const syncedStripeStatus = pickOne(params.stripeStatus);
  const syncedStripePlanCode = pickOne(params.stripePlanCode);
  const errorCode = pickOne(params.error);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      isActive: true,
      mustResetPassword: true,
      createdAt: true,
      stripeCustomer: {
        select: { stripeCustomerId: true },
      },
      coachProfiles: {
        select: {
          id: true,
          slug: true,
          profileStatus: true,
          visibilityStatus: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    take: 800,
  });

  const filtered = q
    ? users.filter((user) => {
        const haystack = [
          user.email,
          user.displayName || "",
          user.role,
          user.stripeCustomer?.stripeCustomerId || "",
          user.coachProfiles.map((profile) => profile.slug).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
    : users;

  const adminsCount = users.filter((item) => item.role === "admin").length;
  const coachesCount = users.filter((item) => item.role === "coach").length;
  const clientsCount = users.filter((item) => item.role === "client").length;

  return (
    <>
      <PageHero
        badge="Admin"
        title="Usuarios y roles"
        description="Cambia el rol de cliente a coach y viceversa, con control de sesión y perfiles asociados."
      />
      <PageShell className="pt-8">
        {updated && targetEmail ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Rol actualizado para <strong>{targetEmail}</strong>: {fromRole} -&gt; {toRole}. Perfil coach creado:{" "}
            {createdCoach}. Perfiles pasados a draft/inactive: {drafted}.
          </p>
        ) : null}
        {stripeLinked && stripeEmail && linkedStripeCustomerId ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Stripe customer enlazado para <strong>{stripeEmail}</strong>: {linkedStripeCustomerId}
          </p>
        ) : null}
        {stripeSynced && stripeEmail && syncedStripeSubscriptionId ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {stripeSyncSource === "schedule" ? "Schedule Stripe sincronizado" : "Suscripcion Stripe sincronizada"} para{" "}
            <strong>{stripeEmail}</strong>: {syncedStripeSubscriptionId} ({syncedStripeStatus} /{" "}
            {syncedStripePlanCode})
          </p>
        ) : null}
        {errorCode ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {errorCode === "invalid-payload"
              ? "Datos invalidos para cambiar el rol."
              : errorCode === "not-found"
                ? "No se encontro el usuario."
                : errorCode === "admin-not-editable"
                  ? "No se puede cambiar el rol de un administrador."
                  : errorCode === "impersonate-invalid-payload"
                    ? "Datos invalidos para iniciar la sesion temporal."
                    : errorCode === "impersonate-not-found"
                      ? "No se encontro el usuario objetivo para impersonar."
                      : errorCode === "impersonate-admin-not-allowed"
                        ? "No se puede impersonar a una cuenta admin."
                        : errorCode === "impersonate-inactive"
                          ? "No se puede impersonar a un usuario inactivo."
                          : errorCode === "stripe-invalid-payload"
                            ? "Datos invalidos para guardar el Stripe customer."
                            : errorCode === "stripe-invalid-format"
                              ? "Formato invalido. Usa un id de Stripe tipo cus_xxx."
                              : errorCode === "stripe-not-found"
                                ? "No se encontro el usuario para enlazar Stripe."
                                : errorCode === "stripe-admin-not-editable"
                                  ? "No se permite enlazar Stripe a cuentas admin."
                                  : errorCode === "stripe-customer-not-found"
                                    ? "Ese Stripe customer no existe en la cuenta Stripe conectada."
                                    : errorCode === "stripe-customer-deleted"
                                      ? "Ese Stripe customer esta eliminado en Stripe."
                                      : errorCode === "stripe-customer-already-linked"
                                        ? "Ese Stripe customer ya esta enlazado a otro usuario."
                                        : errorCode === "stripe-validate-failed"
                                          ? "No se pudo validar el Stripe customer en Stripe."
                                          : errorCode === "stripe-sync-invalid-payload"
                                            ? "Datos invalidos para sincronizar la suscripcion."
                                            : errorCode === "stripe-sync-invalid-subscription-format"
                                              ? "Formato invalido. Usa sub_xxx o sub_sched_xxx."
                                              : errorCode === "stripe-sync-not-found"
                                                ? "No se encontro el usuario para sincronizar."
                                                : errorCode === "stripe-sync-admin-not-editable"
                                                  ? "No se permite sincronizar suscripciones para admins."
                                                  : errorCode === "stripe-sync-missing-customer"
                                                    ? "Primero debes guardar el Stripe customer (cus_xxx)."
                                                    : errorCode === "stripe-sync-no-subscriptions"
                                                      ? "Ese customer no tiene suscripciones ni schedules en Stripe."
                                                      : errorCode === "stripe-sync-subscription-not-found"
                                                        ? "No se encontro la suscripcion/schedule indicado en Stripe."
                                                        : errorCode === "stripe-sync-subscription-without-customer"
                                                          ? "La suscripcion o schedule no tiene customer asociado."
                                                          : errorCode === "stripe-sync-customer-linked-to-other-user"
                                                            ? "La suscripcion/schedule pertenece a un customer ya enlazado a otro usuario."
                                                            : errorCode === "stripe-sync-fetch-failed"
                                                              ? "No se pudo leer la suscripcion/schedule en Stripe."
                  : "No se pudo actualizar el rol."}
          </p>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total usuarios" value={String(users.length)} />
          <StatCard label="Admins" value={String(adminsCount)} />
          <StatCard label="Coaches" value={String(coachesCount)} />
          <StatCard label="Clientes" value={String(clientsCount)} />
        </section>

        <section className="mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <form className="flex flex-wrap items-center gap-3">
            <input
              name="q"
              defaultValue={qRaw}
              placeholder="Buscar por email, nombre, rol o slug de perfil coach"
              className="min-w-72 flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Buscar
            </button>
            <a
              href="/admin/usuarios"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Limpiar
            </a>
          </form>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2">Usuario</th>
                  <th className="px-3 py-2">Rol</th>
                  <th className="px-3 py-2">Perfiles coach</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Alta</th>
                  <th className="px-3 py-2">Accion</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-black/5 align-top">
                    <td className="px-3 py-3">
                      <p className="font-semibold text-zinc-900">{user.displayName || "Sin nombre"}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{user.email}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Stripe: {user.stripeCustomer?.stripeCustomerId || "sin vincular"}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-violet-100 text-violet-700"
                            : user.role === "coach"
                              ? "bg-cyan-100 text-cyan-700"
                              : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-zinc-900">{user.coachProfiles.length}</p>
                      {user.coachProfiles.length ? (
                        <p className="mt-0.5 text-xs text-zinc-500">{user.coachProfiles.map((p) => p.slug).join(", ")}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {user.isActive ? "activo" : "inactivo"}
                        </span>
                        {user.mustResetPassword ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            reset pendiente
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-zinc-700">{formatDate(user.createdAt)}</td>
                    <td className="px-3 py-3">
                      {user.role === "admin" ? (
                        <span className="text-xs font-semibold text-zinc-500">No editable</span>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <form action={impersonateUserAction}>
                              <input type="hidden" name="userId" value={user.id} />
                              <button
                                type="submit"
                                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                              >
                                Entrar como usuario
                              </button>
                            </form>
                            <form action={changeUserRoleAction} className="flex items-center gap-2">
                              <input type="hidden" name="userId" value={user.id} />
                              <input type="hidden" name="targetRole" value={user.role === "coach" ? "client" : "coach"} />
                              <button
                                type="submit"
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
                                  user.role === "coach" ? "bg-zinc-800 hover:bg-black" : "bg-cyan-700 hover:bg-cyan-800"
                                }`}
                              >
                                {user.role === "coach" ? "Pasar a cliente" : "Pasar a coach"}
                              </button>
                            </form>
                          </div>
                          <form action={setUserStripeCustomerIdAction} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="userId" value={user.id} />
                            <input
                              name="stripeCustomerId"
                              defaultValue={user.stripeCustomer?.stripeCustomerId || ""}
                              placeholder="cus_xxx"
                              className="w-44 rounded-lg border border-black/10 px-2.5 py-1.5 text-xs outline-none focus:border-cyan-400"
                            />
                            <button
                              type="submit"
                              className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-900 hover:bg-cyan-100"
                            >
                              Guardar Stripe ID
                            </button>
                          </form>
                          <form action={syncUserStripeSubscriptionAction} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="userId" value={user.id} />
                            <input
                              name="stripeSubscriptionId"
                              placeholder="sub_xxx o sub_sched_xxx (opcional)"
                              className="w-44 rounded-lg border border-black/10 px-2.5 py-1.5 text-xs outline-none focus:border-cyan-400"
                            />
                            <button
                              type="submit"
                              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                            >
                              Sincronizar suscripcion
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {!filtered.length ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-sm text-zinc-600">
                      No hay resultados para esa busqueda.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Al pasar de coach a cliente, sus perfiles de coach se marcan en draft/inactive y se cierran sus sesiones
            activas para aplicar el cambio en el siguiente login.
          </p>
        </section>
      </PageShell>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-zinc-950">{value}</p>
    </div>
  );
}
