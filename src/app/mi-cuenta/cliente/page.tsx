import { ClientFavoritesView } from "@/components/favorites/client-favorites-view";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Panel de cliente",
  description: "Gestiona tus coaches favoritos y vuelve rápido a los perfiles que más te interesan.",
  path: "/mi-cuenta/cliente",
  noindex: true,
});

export default function ClientDashboardPage() {
  return (
    <>
      <PageHero
        badge="Mi cuenta · Cliente"
        title="Panel de cliente"
        description="Gestiona tus coaches favoritos y vuelve rápido a los perfiles que más te interesan."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6">
          <ClientFavoritesView />
        </div>
      </PageShell>
    </>
  );
}
