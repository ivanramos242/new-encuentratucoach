import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contacto",
  description: "Contacta con la plataforma para soporte, certificaciones y dudas sobre membresía.",
  path: "/contacto",
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        badge="Soporte y contacto"
        title="Contacto"
        description="Si necesitas ayuda con la plataforma, la membresía o la certificación de coaches, escríbenos."
      />
      <PageShell className="pt-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <form className="grid gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Nombre
              <input className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Email
              <input type="email" className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-zinc-800">
              Mensaje
              <textarea rows={5} className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400" />
            </label>
            <button className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
              Enviar
            </button>
            <p className="text-sm text-zinc-500">
              V1: formulario visual preparado. El endpoint transaccional se integra en el módulo de backend.
            </p>
          </form>
          <div className="space-y-4">
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Soporte</h2>
              <p className="mt-2 text-sm text-zinc-700">Ayuda general, incidencias técnicas y dudas del directorio.</p>
            </div>
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Certificación</h2>
              <p className="mt-2 text-sm text-zinc-700">
                Revisión documental y dudas sobre el distintivo de coach certificado.
              </p>
            </div>
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Membresía</h2>
              <p className="mt-2 text-sm text-zinc-700">
                Información sobre planes, pagos y activación/desactivación del perfil.
              </p>
            </div>
          </div>
        </div>
      </PageShell>
    </>
  );
}
