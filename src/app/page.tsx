import { HomePage } from "@/components/home/home-page";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Buscar un coach en Madrid y online",
  description:
    "Directorio para buscar coach en Madrid, Barcelona y toda España. Compara coach profesional, coach online y servicios de coaching por ciudad y especialidad.",
  path: "/",
  keywords: [
    "coach madrid",
    "buscar un coach",
    "coach profesional madrid",
    "coach online",
    "busco coach",
    "coach en madrid",
    "mejor coach madrid",
    "busco coach barcelona",
    "encontrar coach",
    "coach madrid precio",
    "servicios de coaching madrid",
    "buscar coach",
    "coaching madrid",
    "coach directivo madrid",
    "coach profesional en madrid",
  ],
});

export default async function HomePageRoute() {
  return <HomePage />;
}
