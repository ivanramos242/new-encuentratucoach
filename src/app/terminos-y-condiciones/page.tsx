import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";

const UPDATED_AT = "20/01/2026";

export const metadata = buildMetadata({
  title: "Términos y condiciones",
  description:
    "Condiciones de uso de EncuentraTuCoach.es para Usuarios y Coaches, incluyendo membresía, responsabilidad y jurisdicción.",
  path: "/terminos-y-condiciones",
  keywords: ["términos y condiciones", "condiciones de uso", "membresía coaches", "encuentratucoach"],
});

export default function TermsPage() {
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Términos y condiciones | EncuentraTuCoach",
    url: "https://encuentratucoach.es/terminos-y-condiciones",
    inLanguage: "es",
    dateModified: "2026-01-20",
  };

  return (
    <>
      <JsonLd data={webPageSchema} />
      <PageHero
        badge="Legal"
        title="Términos y condiciones"
        description="Normas de uso de la Plataforma, relación entre Usuario y Coach, membresía y límites de responsabilidad."
      />

      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">
            Última actualización: <strong>{UPDATED_AT}</strong>
          </p>
          <p className="mt-3 text-sm text-zinc-700">
            El acceso, navegación y uso de encuentratucoach.es (la Plataforma) implica la aceptación de estos
            términos y condiciones.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">1. Objeto y funcionamiento de la Plataforma</h2>
          <p className="mt-2 text-sm text-zinc-700">
            EncuentraTuCoach.es facilita el descubrimiento y contacto entre personas interesadas en coaching
            (Usuarios) y profesionales del coaching que crean un perfil en el directorio (Coaches).
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            La Plataforma puede ofrecer funcionalidades como creación y edición de perfil, directorio, filtros,
            mensajería interna, favoritos y reseñas/valoraciones, así como una membresía para Coaches con herramientas
            y visibilidad.
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            Algunos perfiles pueden mostrar un distintivo de verificación cuando se ha revisado documentación aportada.
            La verificación no implica garantía de resultados, calidad del servicio ni adecuación a un objetivo
            concreto.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">2. Definiciones</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>
              <strong>Usuario:</strong> persona que navega o usa la Plataforma para buscar información o contactar con
              Coaches.
            </li>
            <li>
              <strong>Coach:</strong> profesional que crea un perfil y utiliza la Plataforma, con o sin membresía.
            </li>
            <li>
              <strong>Servicios del Coach:</strong> sesiones, programas u otros servicios prestados directamente por el
              Coach al Usuario.
            </li>
            <li>
              <strong>Membresía:</strong> suscripción de pago para Coaches que habilita funcionalidades adicionales,
              según el plan vigente.
            </li>
          </ul>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">3. Aceptación y vigencia</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Si no estás de acuerdo con estos términos, debes abstenerte de usar la Plataforma.
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            La Plataforma puede actualizar estos términos en cualquier momento. La fecha de última actualización
            indicará la versión vigente.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">4. Condiciones de acceso, registro y cuenta</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>
              El acceso al sitio es, en general, gratuito para Usuarios, salvo que se indique lo contrario en alguna
              funcionalidad.
            </li>
            <li>
              Para publicar un perfil o acceder a funcionalidades, puede ser necesario registrarse y facilitar
              información veraz y actualizada.
            </li>
            <li>
              El titular de la cuenta es responsable de la confidencialidad de sus credenciales y de toda actividad
              realizada desde su cuenta.
            </li>
            <li>
              La Plataforma podrá solicitar verificación o documentación adicional para determinadas funciones, sin
              obligación de concederla.
            </li>
          </ul>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">5. Normas de uso, conducta y contenido</h2>
          <p className="mt-2 text-sm text-zinc-700">Queda prohibido:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>Usar la Plataforma con fines ilícitos, fraudulentos o contrarios a la buena fe.</li>
            <li>
              Publicar contenido falso, difamatorio, discriminatorio, sexualmente explícito, acosador o que vulnere
              derechos de terceros.
            </li>
            <li>Suplantar identidades o manipular reseñas/valoraciones, incluidas reseñas falsas o compradas.</li>
            <li>Intentar acceder, alterar o interferir en sistemas, seguridad o funcionamiento del sitio.</li>
          </ul>
          <p className="mt-2 text-sm text-zinc-700">
            La Plataforma podrá retirar contenidos, suspender cuentas o limitar acceso cuando existan indicios
            razonables de incumplimiento.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">6. Relación entre Usuario y Coach</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Los Servicios del Coach (sesiones, programas, condiciones, precios, cancelaciones, garantías o resultados)
            son acordados directamente entre Usuario y Coach.
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            EncuentraTuCoach.es actúa como plataforma de intermediación tecnológica y no es parte en la relación
            contractual o profesional entre Usuario y Coach.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">
            7. La Plataforma no garantiza clientes para Coaches
          </h2>
          <p className="mt-2 text-sm text-zinc-700">La Plataforma proporciona visibilidad y herramientas, pero no promete ni garantiza:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>Un número mínimo de solicitudes, leads o clientes.</li>
            <li>Ingresos, facturación o retorno económico.</li>
            <li>Posicionamiento concreto en listados, búsquedas o filtros.</li>
            <li>Resultados profesionales derivados del uso de la Plataforma.</li>
          </ul>
          <p className="mt-2 text-sm text-zinc-700">
            La captación de clientes depende de factores ajenos a la Plataforma, como demanda del mercado,
            especialidad, ubicación, tarifas, disponibilidad, reputación, contenido del perfil y decisiones del
            Usuario. Si un Coach no recibe clientes, no constituye incumplimiento imputable a la Plataforma.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">8. Condiciones de contratación de la membresía</h2>
          <h3 className="mt-3 text-base font-bold text-zinc-900">8.1 Planes, precio y características</h3>
          <p className="mt-1 text-sm text-zinc-700">
            La membresía habilita funcionalidades y ventajas para Coaches. El precio y detalle de cada plan se muestra
            en la página de membresía vigente.
          </p>

          <h3 className="mt-3 text-base font-bold text-zinc-900">8.2 Pago y facturación</h3>
          <p className="mt-1 text-sm text-zinc-700">
            Los pagos pueden gestionarse mediante proveedores externos de pago (por ejemplo, tarjeta y/o PayPal), que
            tratan datos necesarios para procesar la transacción conforme a sus propias políticas.
          </p>

          <h3 className="mt-3 text-base font-bold text-zinc-900">8.3 Renovación automática</h3>
          <p className="mt-1 text-sm text-zinc-700">
            Salvo que se indique lo contrario en el proceso de compra, la membresía es recurrente y se renueva
            automáticamente al finalizar el periodo contratado, cargándose el importe correspondiente al método de pago
            registrado.
          </p>

          <h3 className="mt-3 text-base font-bold text-zinc-900">8.4 Cancelación</h3>
          <p className="mt-1 text-sm text-zinc-700">
            El Coach puede cancelar la renovación en cualquier momento desde la configuración de su cuenta. La
            cancelación evitará cargos futuros y mantendrá el acceso hasta el final del periodo ya pagado, salvo que se
            indique lo contrario.
          </p>

          <h3 className="mt-3 text-base font-bold text-zinc-900">8.5 Reembolsos</h3>
          <p className="mt-1 text-sm text-zinc-700">
            Con carácter general, una vez iniciado un periodo de membresía (y especialmente tras una renovación), no se
            realizan reembolsos por tiempo no consumido, salvo obligación legal o incidencia técnica imputable a la
            Plataforma que imposibilite el servicio de forma sustancial.
          </p>

          <h3 className="mt-3 text-base font-bold text-zinc-900">8.6 Cambios de precio o condiciones</h3>
          <p className="mt-1 text-sm text-zinc-700">
            La Plataforma podrá modificar precios o condiciones de la membresía. Cualquier cambio aplicará desde su
            publicación y, si afecta a una suscripción activa, se comunicará por medios razonables antes de la
            siguiente renovación cuando sea posible.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">9. Reseñas, valoraciones y moderación</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Las reseñas deben ser honestas y basarse en una experiencia real. La Plataforma puede moderar, ocultar o
            eliminar reseñas si detecta abuso, lenguaje inapropiado o indicios razonables de falsedad.
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            La Plataforma no está obligada a publicar todas las reseñas y puede aplicar sistemas anti-fraude.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">10. Propiedad intelectual y licencia de contenidos</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Todos los elementos de la Plataforma (diseño, marca, textos, software, estructura, etc.) están protegidos
            por derechos de propiedad intelectual e industrial y pertenecen a la Plataforma o a sus licenciantes.
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            El Coach garantiza que tiene derechos sobre los contenidos que sube (texto, imágenes, logotipos) y concede
            a la Plataforma una licencia no exclusiva para alojarlos, reproducirlos y comunicarlos públicamente con el
            fin de mostrar el perfil dentro del directorio y funcionalidades relacionadas, mientras el perfil esté
            activo.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">11. Enlaces y servicios de terceros</h2>
          <p className="mt-2 text-sm text-zinc-700">
            La Plataforma puede incluir enlaces o integrar servicios de terceros (por ejemplo, pasarelas de pago, chat
            o analítica). La Plataforma no se responsabiliza de contenidos, políticas o prácticas de dichos terceros.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">12. Exclusión de garantías y responsabilidad</h2>
          <p className="mt-2 text-sm text-zinc-700">
            La Plataforma se ofrece tal cual. Aunque se realizan esfuerzos razonables por mantener la disponibilidad,
            no se garantiza que el servicio sea ininterrumpido o libre de errores.
          </p>
          <p className="mt-2 text-sm text-zinc-700">En la máxima medida permitida por la ley, la Plataforma no será responsable por:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>Actuaciones, ofertas, promesas o resultados derivados de los Servicios del Coach.</li>
            <li>
              Daños derivados de decisiones tomadas por Usuarios basadas en perfiles, reseñas o información aportada
              por terceros.
            </li>
            <li>Fallos técnicos atribuibles a terceros o causas de fuerza mayor.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">13. Modificación, suspensión y terminación</h2>
          <p className="mt-2 text-sm text-zinc-700">
            La Plataforma podrá modificar, suspender o interrumpir funcionalidades, total o parcialmente, por motivos
            operativos, legales o de seguridad.
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            Asimismo, podrá suspender o cancelar cuentas que incumplan estos términos.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">14. Legislación aplicable y jurisdicción</h2>
          <p className="mt-2 text-sm text-zinc-700">Estos términos se rigen por la legislación española.</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>
              Si actúas como consumidor, podrán ser competentes los juzgados y tribunales de tu domicilio, según
              normativa aplicable.
            </li>
            <li>
              Si actúas como profesional o empresa, las partes se someten, con renuncia expresa a cualquier otro fuero,
              a los juzgados y tribunales de Toledo (España).
            </li>
          </ul>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">15. Contacto</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Para dudas sobre estos términos o incidencias, escribe a{" "}
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
