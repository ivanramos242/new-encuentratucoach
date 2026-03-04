import type { NextConfig } from "next";

function remotePatternFromUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port || undefined,
    };
  } catch {
    return null;
  }
}

function isEnvTrue(value?: string | null) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function enforceProductionSeoGuard() {
  const guardEnabled = process.env.SEO_ENFORCE_INDEXING_GUARD?.trim().toLowerCase() !== "false";
  const isProdBuild = process.env.NODE_ENV === "production";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
  const targetsPrimaryDomain = siteUrl.includes("encuentratucoach.es");

  if (!guardEnabled || !isProdBuild || !targetsPrimaryDomain) return;

  if (!isEnvTrue(process.env.SEO_ALLOW_INDEXING)) {
    throw new Error(
      "SEO guard bloqueado: SEO_ALLOW_INDEXING debe ser true para desplegar en el dominio principal.",
    );
  }
}

enforceProductionSeoGuard();

const s3PublicPattern = remotePatternFromUrl(process.env.S3_PUBLIC_BASE_URL);
const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "form-action 'self' https://checkout.stripe.com",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      { source: "/portal-de-coaches", destination: "/coaches", permanent: true },
      { source: "/portal-de-coaches/:path*", destination: "/coaches", permanent: true },
      { source: "/coaching-en-espana", destination: "/coaches", permanent: true },
      { source: "/blog-de-coaching", destination: "/blog", permanent: true },
      { source: "/category/blog", destination: "/blog", permanent: true },
      { source: "/category/blog/page/:page", destination: "/blog", permanent: true },
      { source: "/membresia-para-coaches", destination: "/membresia", permanent: true },
      { source: "/buscar-coach-madrid", destination: "/coaches/ciudad/madrid", permanent: true },
      { source: "/buscar-coach-en-barcelona", destination: "/coaches/ciudad/barcelona", permanent: true },
      { source: "/buscar-coach-en-valencia", destination: "/coaches/ciudad/valencia", permanent: true },
      { source: "/buscar-coach-en-bilbao", destination: "/coaches/ciudad/bilbao", permanent: true },
      { source: "/iniciar_sesion", destination: "/iniciar-sesion", permanent: true },
      { source: "/coaching-que-es", destination: "/que-es-el-coaching-y-para-que-sirve", permanent: true },
    ];
  },
  async headers() {
    const baseHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
      ...(process.env.NODE_ENV === "production"
        ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
        : []),
    ];
    const noStoreHeaders = [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" }];

    return [
      { source: "/:path*", headers: baseHeaders },
      { source: "/admin/:path*", headers: noStoreHeaders },
      { source: "/mi-cuenta/:path*", headers: noStoreHeaders },
      { source: "/api/auth/:path*", headers: noStoreHeaders },
      { source: "/api/stripe/:path*", headers: noStoreHeaders },
      { source: "/api/admin/:path*", headers: noStoreHeaders },
      { source: "/api/messages/:path*", headers: noStoreHeaders },
      { source: "/api/uploads/:path*", headers: noStoreHeaders },
      { source: "/api/coach-profile/:path*", headers: noStoreHeaders },
      { source: "/api/internal/:path*", headers: noStoreHeaders },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "encuentratucoach.es" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "padel-minio.obdyzx.easypanel.host" },
      { protocol: "https", hostname: "**.easypanel.host" },
      ...(s3PublicPattern ? [s3PublicPattern] : []),
    ],
  },
};

export default nextConfig;
