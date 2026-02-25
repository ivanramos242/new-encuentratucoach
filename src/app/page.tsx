import { HomePage } from "@/components/home/home-page";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Inicio",
  description:
    "Encuentra coaches en España por especialidad, ciudad, modalidad y presupuesto. Directorio SEO con perfiles y contacto directo.",
  path: "/",
});

export default async function HomePageRoute() {
  return <HomePage />;
}
