import { NextResponse, type NextRequest } from "next/server";
import migrationMap from "../seo/migration-map.json";
import { blogPosts, coachCategories, coaches, cities } from "@/lib/mock-data";

const exactRedirects = migrationMap.exact as Record<string, string>;
const categorySlugs = new Set(coachCategories.map((item) => item.slug));
const citySlugs = new Set(cities.map((item) => item.slug));
const coachSlugs = new Set(coaches.map((item) => item.slug));
const blogSlugs = new Set(blogPosts.map((item) => item.slug));
const staticCanonicalPaths = new Set([
  "/",
  "/coaches",
  "/contacto",
  "/membresia",
  "/pregunta-a-un-coach",
  "/coaching-personal",
  "/plataformas-para-trabajar-como-coach",
  "/sobre-nosotros",
  "/blog",
  "/faqs",
  "/aviso-legal",
  "/cookies",
  "/privacidad",
  "/iniciar-sesion",
  "/registro/cliente",
  "/registro/coach",
  "/recuperar-contrasena",
]);

function isKnownCanonicalPath(pathname: string) {
  if (staticCanonicalPaths.has(pathname)) return true;

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 2 && parts[0] === "coaches") {
    return coachSlugs.has(parts[1]);
  }

  if (parts.length === 3 && parts[0] === "coaches" && parts[1] === "ciudad") {
    return citySlugs.has(parts[2]);
  }

  if (parts.length === 3 && parts[0] === "coaches" && parts[1] === "categoria") {
    return categorySlugs.has(parts[2]);
  }

  if (parts.length === 4 && parts[0] === "coaches" && parts[1] === "categoria") {
    return categorySlugs.has(parts[2]) && citySlugs.has(parts[3]);
  }

  if (parts.length === 2 && parts[0] === "blog") {
    return blogSlugs.has(parts[1]);
  }

  return false;
}

function redirectTo(request: NextRequest, destinationPath: string) {
  const url = new URL(request.url);
  url.pathname = destinationPath;
  url.search = request.nextUrl.search;
  return NextResponse.redirect(url, 301);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const parts = pathname.split("/").filter(Boolean);

  const exactDestination = exactRedirects[pathname];
  if (exactDestination && exactDestination !== pathname) {
    return redirectTo(request, exactDestination);
  }

  if (parts.length === 1 && blogSlugs.has(parts[0])) {
    return redirectTo(request, `/blog/${parts[0]}`);
  }

  if (parts.length === 2 && parts[0] === "coaches_category" && categorySlugs.has(parts[1])) {
    return redirectTo(request, `/coaches/categoria/${parts[1]}`);
  }

  if (pathname !== "/" && pathname.endsWith("/")) {
    const normalized = pathname.replace(/\/+$/, "");
    if (isKnownCanonicalPath(normalized)) {
      return redirectTo(request, normalized);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
