export const siteConfig = {
  name: "EncuentraTuCoach",
  domain: "encuentratucoach.local",
  url: "http://localhost:3000",
  description:
    "Directorio de coaches en España para encontrar coaching personal, de carrera, liderazgo y más, online o presencial.",
  locale: "es-ES",
} as const;

export const siteNav = [
  { href: "/", label: "Inicio" },
  { href: "/coaches", label: "Nuestros Coaches" },
  { href: "/membresia", label: "Membresía" },
  { href: "/sobre-nosotros", label: "Sobre nosotros" },
  { href: "/contacto", label: "Contacto" },
  { href: "/blog", label: "Blog" },
] as const;
