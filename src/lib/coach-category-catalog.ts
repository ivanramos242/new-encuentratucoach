import { slugify } from "@/lib/utils";

const CATEGORY_NAMES = [
  "Adolescentes",
  "Auto-Disciplina",
  "Bienestar",
  "Biodescodificación",
  "Bioemocional",
  "Carrera",
  "Coach de Padres",
  "Confianza en Sí Mismo",
  "Conflictos",
  "Corporal",
  "Creativo",
  "De equipos",
  "De Imagen",
  "Deportivo",
  "Duelos",
  "Educativo",
  "Ejecutivo",
  "Emocional",
  "Emprendedores",
  "Espiritual",
  "Estrategia Empresarial",
  "Estudiantes",
  "Familiar",
  "Felicidad",
  "Femenino",
  "Financiero",
  "Fitness",
  "Gestión del Cambio",
  "Habilidades de Negociación",
  "Health Coaching",
  "Holístico",
  "Inteligencia Emocional",
  "Laboral",
  "Liderazgo",
  "Marketing Personal",
  "Masculinidad",
  "Motivacional",
  "Mujeres Emprendedoras",
  "Neurocoaching",
  "Neuroliderazgo",
  "Nutricional",
  "Oratoria",
  "Parejas",
  "Personal",
  "Personas con Discapacidad",
  "PNL",
  "Productividad",
  "Propósito de Vida",
  "Psicológico",
  "Reinvención Profesional",
  "Relaciones",
  "Salud Mental",
  "Sexualidad",
  "Social",
  "Ventas",
  "Vida",
  "Viud@s",
  "Vocacional",
] as const;

export const COACH_CATEGORY_CATALOG = CATEGORY_NAMES.map((name, index) => ({
  name,
  slug: slugify(name),
  sortOrder: index,
}));

export function getCoachCategoryCatalogLabelsMap() {
  return new Map(COACH_CATEGORY_CATALOG.map((item) => [item.slug, item.name]));
}

export function getCoachCategoryLabel(slug: string) {
  return getCoachCategoryCatalogLabelsMap().get(slug) || slug;
}
