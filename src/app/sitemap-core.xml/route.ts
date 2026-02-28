import { renderSitemapUrlset, xmlResponse } from "@/lib/sitemap-xml";

const CORE_PATHS = [
  "/",
  "/coaches",
  "/coaches/modalidad/online",
  "/coaches/certificados",
  "/membresia",
  "/plataformas-para-trabajar-como-coach",
  "/conseguir-clientes-como-coach",
  "/sobre-nosotros",
  "/contacto",
  "/blog",
  "/faqs",
  "/pregunta-a-un-coach",
] as const;

export async function GET() {
  const now = new Date().toISOString();
  return xmlResponse(
    renderSitemapUrlset(
      CORE_PATHS.map((path) => ({
        path,
        lastModified: now,
      })),
    ),
  );
}
