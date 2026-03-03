import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getSiteBaseUrl } from "@/lib/site-config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatEuro(amount: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function absoluteUrl(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("absoluteUrl solo acepta rutas internas que empiecen por '/'");
  }
  return `${getSiteBaseUrl()}${path}`;
}

export function isAllowedInternalReturnPath(
  value: string,
  allowedPrefixes: string[],
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return false;
  try {
    const url = new URL(value, getSiteBaseUrl());
    return allowedPrefixes.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`));
  } catch {
    return false;
  }
}
