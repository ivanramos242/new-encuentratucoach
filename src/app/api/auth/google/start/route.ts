import { NextResponse } from "next/server";
import {
  buildGoogleOauthStart,
  getGoogleOauthCookieMaxAgeSeconds,
  getGoogleOauthCookieName,
  getGoogleOauthDefaultReturnTo,
  parseGoogleAuthIntent,
  sanitizeReturnToPath,
} from "@/lib/auth-google";

function redirectToLoginWithError(requestUrl: URL, message: string) {
  const target = new URL("/iniciar-sesion", requestUrl.origin);
  target.searchParams.set("oauth", "google");
  target.searchParams.set("error", message);
  return NextResponse.redirect(target);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const intent = parseGoogleAuthIntent(requestUrl.searchParams.get("intent"));
  const returnTo = sanitizeReturnToPath(
    requestUrl.searchParams.get("returnTo"),
    getGoogleOauthDefaultReturnTo(intent),
  );

  try {
    const start = buildGoogleOauthStart({ intent, returnTo });
    const response = NextResponse.redirect(start.authorizationUrl);
    response.cookies.set(getGoogleOauthCookieName(), start.cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getGoogleOauthCookieMaxAgeSeconds(),
    });
    return response;
  } catch (error) {
    console.error("[auth/google/start] failed", error);
    return redirectToLoginWithError(requestUrl, "No se pudo iniciar el acceso con Google.");
  }
}
