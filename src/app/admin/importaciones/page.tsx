import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { WpCoachesImporter } from "@/components/admin/wp-coaches-importer";

export default function AdminImportacionesPage() {
  return (
    <>
      <PageHero
        badge="Admin"
        title="Importaciones"
        description="Importa coaches desde exportaciones JSON de WordPress sin copiar archivos manualmente al contenedor."
      />
      <PageShell className="pt-8">
        <WpCoachesImporter />
      </PageShell>
    </>
  );
}

