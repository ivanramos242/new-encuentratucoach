import { NextResponse, type NextRequest } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_PROTECTED_PREFIXES = [
  "/api/auth/",
  "/api/stripe/",
  "/api/coach-profile/",
  "/api/uploads/",
  "/api/messages/",
  "/api/admin/",
  "/api/contact/",
  "/api/reviews/",
  "/api/notification-preferences",
  "/api/notifications/",
];
const CSRF_EXEMPT_PREFIXES = ["/api/stripe/webhooks", "/api/internal/jobs/run-due"];
const SENSITIVE_NO_STORE_PREFIXES = [
  "/admin",
  "/mi-cuenta",
  "/api/auth/",
  "/api/stripe/",
  "/api/admin/",
  "/api/messages/",
  "/api/uploads/",
  "/api/coach-profile/",
  "/api/internal/",
];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

function getTrustedOrigins(request: NextRequest) {
  const origins = new Set<string>([request.nextUrl.origin]);
  const configured = process.env.ALLOWED_APP_ORIGINS ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  for (const raw of configured.split(",")) {
    const value = raw.trim();
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // ignore invalid config values
    }
  }
  return origins;
}

function originFromHeaders(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin;
    } catch {
      return null;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }

  return null;
}

function shouldCheckCsrf(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) return false;
  if (!MUTATING_METHODS.has(request.method)) return false;
  if (!startsWithAny(request.nextUrl.pathname, CSRF_PROTECTED_PREFIXES)) return false;
  if (startsWithAny(request.nextUrl.pathname, CSRF_EXEMPT_PREFIXES)) return false;
  return true;
}

export function middleware(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  if (shouldCheckCsrf(request)) {
    const requestOrigin = originFromHeaders(request);
    const trustedOrigins = getTrustedOrigins(request);
    if (!requestOrigin || !trustedOrigins.has(requestOrigin)) {
      const response = NextResponse.json(
        {
          ok: false,
          message: "Solicitud bloqueada por política de origen.",
          code: "CSRF_ORIGIN_REJECTED",
        },
        { status: 403 },
      );
      response.headers.set("x-request-id", requestId);
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      return response;
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);

  if (startsWithAny(request.nextUrl.pathname, SENSITIVE_NO_STORE_PREFIXES)) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};

