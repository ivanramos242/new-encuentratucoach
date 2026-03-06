import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";

const UPDATED_AT = "20/01/2026";

export const metadata = buildMetadata({
  title: "Aviso legal",
  description:
    "Datos del titular, información legal y datos de contacto de EncuentraTuCoach.es conforme a LSSI-CE y normativa aplicable.",
  path: "/aviso-legal",
  noindex: true,
  keywords: ["aviso legal", "LSSI-CE", "titular web", "encuentratucoach"],
});

export default function LegalNoticePage() {
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Aviso legal | EncuentraTuCoach",
    url: "https://encuentratucoach.es/aviso-legal",
    inLanguage: "es",
    dateModified: "2026-01-20",
  };

  return (
    <>
      <JsonLd data={webPageSchema} />
      <PageHero
        badge="Legal"
        title="Aviso legal"
        description="Información de titularidad, contacto y condiciones legales básicas de la Plataforma."
      />

      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">
            Última actualización: <strong>{UPDATED_AT}</strong>
          </p>
          <p className="mt-3 text-sm text-zinc-700">
            En cumplimiento de la normativa aplicable, se informa de que el sitio web <strong>encuentratucoach.es</strong>
            {" "}(en adelante, la <strong>Plataforma</strong>) es titularidad de:
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">1. Datos del titular (LSSI-CE)</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>
              <strong>Empresa:</strong> encuentratucoach
            </li>
            <li>
              <strong>NIF:</strong> X6181566V
            </li>
            <li>
              <strong>Dirección:</strong> C/ Libertad, nº 6, 45183, Toledo, España
            </li>
            <li>
              <strong>Correo electrónico:</strong>{" "}
              <a href="mailto:info@encuentratucoach.es" className="font-semibold underline underline-offset-2">
                info@encuentratucoach.es
              </a>
            </li>
          </ul>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">2. Responsable del tratamiento de datos</h2>
          <p className="mt-2 text-sm text-zinc-700">
            De conformidad con la normativa de protección de datos, el Responsable del Tratamiento de los datos
            personales tratados en la Plataforma es la entidad titular indicada en el apartado anterior.
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            El detalle de finalidades, bases legales, destinatarios, conservación y derechos se regula en la{" "}
            <Link href="/privacidad" className="font-semibold underline underline-offset-2">
              Política de Privacidad
            </Link>
            {" "}y en la{" "}
            <Link href="/cookies" className="font-semibold underline underline-offset-2">
              Política de Cookies
            </Link>
            .
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">3. Condiciones de uso de la Plataforma</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Las condiciones que regulan el acceso, registro, uso de la Plataforma, membresía de Coaches,
            limitaciones de responsabilidad y jurisdicción se recogen en:
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            <Link href="/terminos-y-condiciones" className="font-semibold underline underline-offset-2">
              Términos y condiciones
            </Link>
            .
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">4. Contacto</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Para dudas legales, incidencias o ejercicio de derechos, puedes escribir a{" "}
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
