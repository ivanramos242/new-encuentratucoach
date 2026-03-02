import { OpenCookieSettingsButton } from "@/components/cookies/open-cookie-settings-button";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";

const UPDATED_AT = "2 de marzo de 2026";

const COOKIE_TABLE = [
  {
    name: "etc_session",
    provider: "EncuentraTuCoach",
    purpose: "Mantener la sesión iniciada y proteger accesos autenticados.",
    retention: "Hasta 30 días (o cierre de sesión).",
    type: "Técnica (necesaria)",
  },
  {
    name: "etc_cookie_consent",
    provider: "EncuentraTuCoach",
    purpose: "Guardar tus preferencias de consentimiento de cookies.",
    retention: "180 días.",
    type: "Técnica (necesaria)",
  },
  {
    name: "crisp-client/*",
    provider: "Crisp",
    purpose: "Habilitar el chat en vivo y recordar el estado de conversación.",
    retention: "Según política del proveedor (habitualmente hasta 6 meses).",
    type: "Preferencias (opcional)",
  },
];

export const metadata = buildMetadata({
  title: "Política de Cookies",
  description:
    "Información sobre el uso de cookies, consentimiento, revocación y gestión de preferencias en EncuentraTuCoach.",
  path: "/cookies",
  keywords: ["política de cookies", "cookies RGPD", "consentimiento cookies", "encuentratucoach cookies"],
});

export default function CookiesPage() {
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Política de Cookies | EncuentraTuCoach",
    url: "https://encuentratucoach.es/cookies",
    inLanguage: "es",
    dateModified: "2026-03-02",
  };

  return (
    <>
      <JsonLd data={webPageSchema} />
      <PageHero
        badge="Legal"
        title="Política de Cookies"
        description="Aquí explicamos qué cookies usamos, para qué, durante cuánto tiempo y cómo puedes aceptar, rechazar o retirar tu consentimiento."
      />

      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">
            Última actualización: <strong>{UPDATED_AT}</strong>
          </p>
          <p className="mt-3 text-sm text-zinc-700">
            Esta Política de Cookies se aplica a <strong>encuentratucoach.es</strong> y se interpreta conforme al
            RGPD (UE 2016/679), la LOPDGDD (España) y la normativa vigente sobre comunicaciones electrónicas y uso de
            cookies.
          </p>
          <div className="mt-4">
            <OpenCookieSettingsButton />
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">1. Qué son las cookies</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Las cookies son pequeños archivos que se almacenan en tu dispositivo cuando visitas una web. Permiten, por
            ejemplo, recordar tu sesión, guardar preferencias o habilitar funciones de soporte.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">2. Tipos de cookies que usamos</h2>
          <div className="mt-3 grid gap-3 text-sm text-zinc-700">
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <p className="font-semibold text-zinc-900">Técnicas (necesarias)</p>
              <p className="mt-1">Permiten el funcionamiento básico del sitio, seguridad y gestión de sesión.</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <p className="font-semibold text-zinc-900">Preferencias (opcionales)</p>
              <p className="mt-1">Permiten recordar ajustes y activar herramientas de soporte, como el chat Crisp.</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <p className="font-semibold text-zinc-900">Analítica y marketing (opcionales)</p>
              <p className="mt-1">
                Actualmente no activamos cookies de analítica o marketing por defecto sin consentimiento explícito.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">3. Detalle de cookies</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-zinc-900">
                  <th className="px-3 py-2 font-semibold">Cookie</th>
                  <th className="px-3 py-2 font-semibold">Proveedor</th>
                  <th className="px-3 py-2 font-semibold">Finalidad</th>
                  <th className="px-3 py-2 font-semibold">Conservación</th>
                  <th className="px-3 py-2 font-semibold">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {COOKIE_TABLE.map((cookie) => (
                  <tr key={cookie.name} className="border-b border-black/5 align-top text-zinc-700">
                    <td className="px-3 py-2 font-semibold text-zinc-900">{cookie.name}</td>
                    <td className="px-3 py-2">{cookie.provider}</td>
                    <td className="px-3 py-2">{cookie.purpose}</td>
                    <td className="px-3 py-2">{cookie.retention}</td>
                    <td className="px-3 py-2">{cookie.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            Nota: algunas cookies de terceros pueden variar en nombre o duración según actualizaciones del proveedor.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">4. Base jurídica y consentimiento</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>Las cookies técnicas se usan por interés legítimo y necesidad funcional del servicio.</li>
            <li>Las cookies opcionales solo se activan si las aceptas expresamente en el banner/configuración.</li>
            <li>Tu elección se guarda para no mostrar el banner en cada visita.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">5. Cómo cambiar o retirar el consentimiento</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Puedes modificar tu consentimiento en cualquier momento pulsando el botón fijo <strong>“Cookies”</strong>{" "}
            que aparece en la parte inferior izquierda de la web.
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            También puedes bloquear o eliminar cookies desde la configuración de tu navegador.
          </p>
          <div className="mt-4">
            <OpenCookieSettingsButton />
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">6. Más información y contacto</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Para más información sobre tratamiento de datos personales, consulta nuestra{" "}
            <a href="/privacidad" className="font-semibold underline underline-offset-2">
              Política de Privacidad
            </a>
            . Si tienes dudas, puedes escribir a{" "}
            <a href="mailto:info@encuentratucoach.es" className="font-semibold underline underline-offset-2">
              info@encuentratucoach.es
            </a>
            .
          </p>
        </section>
      </PageShell>
    </>
  );
}
