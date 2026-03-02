import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";

const UPDATED_AT = "20/01/2026";

const PURPOSES = [
  {
    purpose: "Crear y gestionar tu cuenta, autenticación y acceso a funcionalidades.",
    legalBasis: "Ejecución de contrato y/o medidas precontractuales.",
  },
  {
    purpose:
      "Gestionar el directorio y, en el caso de Coaches, publicar el perfil con la información que decidas mostrar.",
    legalBasis:
      "Ejecución de contrato (si eres Coach) y/o consentimiento o configuración del propio usuario al publicar datos.",
  },
  {
    purpose: "Permitir contacto entre Usuarios y Coaches (formularios, mensajería y envío de emails).",
    legalBasis: "Ejecución de contrato o medidas precontractuales e interés legítimo en facilitar el servicio solicitado.",
  },
  {
    purpose: "Gestionar la membresía de Coaches (altas, renovaciones, cancelaciones, soporte y facturación).",
    legalBasis: "Ejecución de contrato y cumplimiento de obligaciones legales.",
  },
  {
    purpose: "Atender solicitudes de soporte y consultas (formulario de contacto y chat).",
    legalBasis: "Interés legítimo y/o ejecución de medidas precontractuales a petición del interesado.",
  },
  {
    purpose: "Publicar y moderar reseñas/valoraciones para aportar confianza y evitar abuso o fraude.",
    legalBasis: "Interés legítimo y consentimiento del usuario al publicar contenido.",
  },
  {
    purpose: "Seguridad, prevención de fraude, mantenimiento y disponibilidad del sitio.",
    legalBasis: "Interés legítimo y cumplimiento de obligaciones legales.",
  },
  {
    purpose: "Envío de comunicaciones comerciales (solo si lo aceptas) y gestión de preferencias.",
    legalBasis: "Consentimiento (retirable en cualquier momento).",
  },
] as const;

export const metadata = buildMetadata({
  title: "Política de privacidad",
  description:
    "Información sobre tratamiento de datos personales en EncuentraTuCoach.es conforme al RGPD y la LOPDGDD.",
  path: "/privacidad",
  keywords: ["política de privacidad", "RGPD", "LOPDGDD", "datos personales", "encuentratucoach"],
});

export default function PrivacyPage() {
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Política de privacidad | EncuentraTuCoach",
    url: "https://encuentratucoach.es/privacidad",
    inLanguage: "es",
    dateModified: "2026-01-20",
  };

  return (
    <>
      <JsonLd data={webPageSchema} />
      <PageHero
        badge="Legal"
        title="Política de privacidad"
        description="Cómo tratamos tus datos personales en la Plataforma, con qué base legal y qué derechos puedes ejercer."
      />

      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">
            Última actualización: <strong>{UPDATED_AT}</strong>
          </p>
          <p className="mt-3 text-sm text-zinc-700">
            En encuentratucoach.es (EncuentraTuCoach, la Plataforma) nos comprometemos a proteger tu privacidad y
            a tratar tus datos personales de forma lícita, leal y transparente, de acuerdo con el Reglamento (UE)
            2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">1. Responsable del tratamiento</h2>
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
          <h2 className="text-xl font-black tracking-tight text-zinc-950">2. A quién aplica</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>Usuarios que navegan por la Plataforma, buscan Coaches y contactan con profesionales.</li>
            <li>
              Coaches que crean un perfil, publican información profesional y, en su caso, contratan una membresía.
            </li>
          </ul>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">3. Datos que podemos tratar</h2>
          <p className="mt-2 text-sm text-zinc-700">Según el uso que hagas de la Plataforma, podemos tratar:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>Datos identificativos y de contacto: nombre, email, teléfono (si lo facilitas) y empresa (si procede).</li>
            <li>Datos de cuenta: credenciales, estado de cuenta y preferencias.</li>
            <li>
              Datos de perfil de Coaches: especialidad, ubicación, modalidad, idiomas, precio orientativo, biografía,
              enlaces, fotos y otros datos que decidas publicar.
            </li>
            <li>Comunicaciones: mensajes enviados en formularios, chat, mensajería interna o email al Coach.</li>
            <li>Reseñas/valoraciones: contenido y puntuaciones publicadas en la Plataforma.</li>
            <li>Datos de contratación de Coaches: plan, estado de suscripción y operaciones necesarias para gestión.</li>
            <li>
              Datos de pago: no almacenamos el número completo de tarjeta; el proveedor de pago procesa la transacción
              y nos comunica identificadores necesarios.
            </li>
            <li>Datos técnicos: IP, logs de seguridad, dispositivo/navegador y cookies según consentimientos.</li>
          </ul>
          <p className="mt-3 text-sm text-zinc-700">
            Recomendación de privacidad: evita publicar datos personales sensibles o innecesarios en tu perfil o
            reseñas.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">4. Cómo obtenemos tus datos</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>Cuando te registras o gestionas tu cuenta.</li>
            <li>Cuando rellenas formularios (contacto, envío de email a un Coach, reseñas, etc.).</li>
            <li>Cuando contratas una membresía (Coaches).</li>
            <li>Cuando usas mensajería interna o canales de soporte.</li>
            <li>Automáticamente, mediante cookies y logs técnicos, según tu configuración y consentimiento.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">5. Finalidades y base legal</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-zinc-900">
                  <th className="px-3 py-2 font-semibold">Finalidad</th>
                  <th className="px-3 py-2 font-semibold">Base legal (art. 6 RGPD)</th>
                </tr>
              </thead>
              <tbody>
                {PURPOSES.map((item) => (
                  <tr key={item.purpose} className="border-b border-black/5 align-top text-zinc-700">
                    <td className="px-3 py-2">{item.purpose}</td>
                    <td className="px-3 py-2">{item.legalBasis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">6. Con quién compartimos tus datos</h2>
          <h3 className="mt-3 text-base font-bold text-zinc-900">6.1 Comparticiones necesarias para el servicio</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>
              Con el Coach: si envías un mensaje, solicitud o email, compartiremos los datos necesarios para su
              respuesta.
            </li>
            <li>
              Con otros usuarios (si eres Coach): la información que publiques en tu perfil y tus reseñas puede ser
              visible en la Plataforma.
            </li>
          </ul>

          <h3 className="mt-3 text-base font-bold text-zinc-900">6.2 Proveedores (encargados del tratamiento)</h3>
          <p className="mt-1 text-sm text-zinc-700">Podemos utilizar proveedores para hosting, seguridad, soporte, correo y pagos.</p>

          <h3 className="mt-3 text-base font-bold text-zinc-900">6.3 Obligación legal</h3>
          <p className="mt-1 text-sm text-zinc-700">
            Podremos comunicar datos a autoridades públicas, jueces y tribunales cuando exista obligación legal o
            requerimiento.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">7. Transferencias internacionales</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Algunos proveedores pueden estar fuera del Espacio Económico Europeo o tratar datos desde terceros países.
            En ese caso, aplicaremos garantías adecuadas conforme al RGPD (como cláusulas contractuales tipo u otros
            mecanismos válidos) y/o decisiones de adecuación cuando existan.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">8. Plazos de conservación</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>Cuenta de Usuario/Coach: mientras esté activa y durante plazos necesarios por responsabilidades legales.</li>
            <li>Perfil de Coach: mientras esté activo y, tras baja, datos mínimos por seguridad, fraude o cumplimiento.</li>
            <li>Comunicaciones: el tiempo necesario para gestionar solicitudes y trazabilidad razonable.</li>
            <li>Datos de membresía y facturación: durante plazos exigidos por normativa fiscal y contable aplicable.</li>
            <li>Consentimientos: mientras sean necesarios para acreditar tu elección.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">9. Tus derechos</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad.
            También puedes retirar tu consentimiento cuando la base legal sea el consentimiento, sin afectar a la
            licitud del tratamiento previo.
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            Para ejercerlos, escribe a{" "}
            <a href="mailto:info@encuentratucoach.es" className="font-semibold underline underline-offset-2">
              info@encuentratucoach.es
            </a>
            {" "}indicando el derecho que deseas ejercer, datos para identificarte y cualquier detalle útil para
            tramitar la solicitud.
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            Si consideras que el tratamiento no se ajusta a la normativa, puedes presentar reclamación ante la Agencia
            Española de Protección de Datos (AEPD).
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">10. Seguridad</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Aplicamos medidas técnicas y organizativas razonables para proteger los datos frente a acceso no autorizado,
            pérdida, alteración o divulgación.
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            Aun así, ningún sistema es completamente infalible. Te recomendamos usar contraseñas robustas y no
            reutilizarlas en otros servicios.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">11. Menores de edad</h2>
          <p className="mt-2 text-sm text-zinc-700">
            La Plataforma no está dirigida a menores de 14 años. Si eres menor de 14, no debes registrarte ni
            facilitarnos tus datos sin autorización de tu madre, padre o tutor legal.
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            Si detectamos datos de menores sin autorización, podremos eliminarlos.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">12. Enlaces a otras políticas</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>
              <Link href="/cookies" className="font-semibold underline underline-offset-2">
                Política de Cookies
              </Link>
              : regula el uso de cookies y cómo gestionar tu consentimiento.
            </li>
            <li>
              <Link href="/aviso-legal" className="font-semibold underline underline-offset-2">
                Aviso legal
              </Link>
              {" "}y{" "}
              <Link href="/terminos-y-condiciones" className="font-semibold underline underline-offset-2">
                Términos y condiciones
              </Link>
              : regulan el uso de la Plataforma, cuentas, membresía y responsabilidades.
            </li>
          </ul>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">13. Cambios en esta política</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Podemos actualizar esta Política de Privacidad cuando cambien los tratamientos o por necesidades legales y
            técnicas.
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            Publicaremos la versión vigente en esta página con su fecha de actualización.
          </p>
        </section>
      </PageShell>
    </>
  );
}
