import { ClientFavoritesView } from "@/components/favorites/client-favorites-view";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";

export default function Page() {
  return (
    <>
      <PageHero
        badge="Mi cuenta · Cliente"
        title="Panel de cliente"
        description="Gestiona tus coaches favoritos y vuelve rapido a los perfiles que mas te interesan."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6">
          <ClientFavoritesView />
        </div>
      </PageShell>
    </>
  );
}
