import { HomePage } from "@/components/home/home-page";
import { buildMetadata } from "@/lib/seo";
import "./home-v4.css";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Buscar coach en España y online",
  description:
    "Busca coach en España por ciudad, especialidad, modalidad y presupuesto. Directorio para comparar perfiles reales y contactar directamente.",
  path: "/",
  keywords: [
    "buscar un coach",
    "buscar coach en españa",
    "buscar coach madrid",
    "buscar coach barcelona",
    "directorio de coaches",
    "coach online",
    "coach presencial",
    "coach por ciudad",
    "coach por especialidad",
    "coaches certificados",
    "encontrar coach",
    "coaching en españa",
    "buscar coach",
  ],
});

export default async function HomePageRoute() {
  return <HomePage />;
}
