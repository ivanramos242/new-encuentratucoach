import { HomePage } from "@/components/home/home-page";
import { buildMetadata } from "@/lib/seo";
import "./home-v4.css";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Buscar coach en España",
  description:
    "Directorio para encontrar coach en España, online o presencial. Compara perfiles por ciudad, especialidad, modalidad y presupuesto.",
  path: "/",
  keywords: [
    "buscar un coach",
    "buscar coach en españa",
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
