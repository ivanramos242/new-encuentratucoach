import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { changeUserRoleAction } from "@/app/admin/usuarios/actions";

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
        {errorCode ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {errorCode === "invalid-payload"
              ? "Datos invalidos para cambiar el rol."
              : errorCode === "not-found"
                ? "No se encontro el usuario."
                : errorCode === "admin-not-editable"
                  ? "No se puede cambiar el rol de un administrador."
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
