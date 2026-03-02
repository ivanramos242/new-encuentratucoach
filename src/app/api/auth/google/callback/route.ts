import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { applySessionCookie } from "@/lib/auth-session";
import {
  exchangeGoogleCodeForTokens,
  fetchGoogleOpenIdProfile,
  getGoogleOauthCookieName,
  getGoogleOauthDefaultReturnTo,
  readGoogleOauthStateCookie,
  sanitizeReturnToPath,
  type GoogleAuthIntent,
} from "@/lib/auth-google";
import { loginOrRegisterUserWithGoogle } from "@/lib/auth-service";

function getAppOrigin(requestUrl: URL) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // fallback to request origin
    }
  }
  return requestUrl.origin;
}

function clearGoogleOauthCookie(response: NextResponse) {
  response.cookies.set(getGoogleOauthCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

function buildLoginErrorRedirect(input: { requestUrl: URL; message: string }) {
  const url = new URL("/iniciar-sesion", getAppOrigin(input.requestUrl));
  url.searchParams.set("oauth", "google");
  url.searchParams.set("error", input.message);
  const response = NextResponse.redirect(url);
  clearGoogleOauthCookie(response);
  return response;
}

function resolvePostGoogleAuthRedirect(input: {
  intent: GoogleAuthIntent;
  returnTo: string;
  role: "admin" | "coach" | "client";
}) {
  if (input.intent === "coach") {
    if (input.role === "coach" || input.role === "admin") return "/mi-cuenta/coach";
    return "/membresia";
  }

  if (input.returnTo) return input.returnTo;
  if (input.role === "admin") return "/admin";
  if (input.role === "coach") return "/mi-cuenta/coach";
  if (input.role === "client") return "/mi-cuenta/cliente";
  return "/mi-cuenta";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();
  const rawStateCookie = cookieStore.get(getGoogleOauthCookieName())?.value;
  const stateCookie = readGoogleOauthStateCookie(rawStateCookie);

  if (!stateCookie) {
    return buildLoginErrorRedirect({
      requestUrl,
      message: "La sesion de Google ha caducado. Vuelve a intentarlo.",
    });
  }

  const stateFromQuery = requestUrl.searchParams.get("state");
  const codeFromQuery = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");

  if (oauthError) {
    return buildLoginErrorRedirect({
      requestUrl,
      message: "Google no autorizo el acceso. Puedes intentarlo de nuevo.",
    });
  }

  if (!stateFromQuery || !codeFromQuery || stateFromQuery !== stateCookie.state) {
    return buildLoginErrorRedirect({
      requestUrl,
      message: "No se pudo validar el acceso con Google.",
    });
  }

  const safeReturnTo = sanitizeReturnToPath(
    stateCookie.returnTo,
    getGoogleOauthDefaultReturnTo(stateCookie.intent),
  );

  try {
    const tokens = await exchangeGoogleCodeForTokens({
      code: codeFromQuery,
      codeVerifier: stateCookie.codeVerifier,
    });
    const profile = await fetchGoogleOpenIdProfile(tokens.accessToken);
    if (!profile.emailVerified) {
      return buildLoginErrorRedirect({
        requestUrl,
        message: "Tu cuenta de Google debe tener un email verificado para continuar.",
      });
    }

    const auth = await loginOrRegisterUserWithGoogle({
      email: profile.email,
      googleSub: profile.sub,
      displayName: profile.name,
      pictureUrl: profile.picture,
      intent: stateCookie.intent,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: request.headers.get("user-agent"),
    });

    if ("error" in auth) {
      return buildLoginErrorRedirect({
        requestUrl,
        message: String(auth.error),
      });
    }

    const postAuthPath = resolvePostGoogleAuthRedirect({
      intent: stateCookie.intent,
      returnTo: safeReturnTo,
      role: auth.user.role,
    });

    const response = NextResponse.redirect(new URL(postAuthPath, getAppOrigin(requestUrl)));
    applySessionCookie(response, auth.session.rawToken, auth.session.expiresAt);
    clearGoogleOauthCookie(response);
    return response;
  } catch (error) {
    console.error("[auth/google/callback] failed", error);
    return buildLoginErrorRedirect({
      requestUrl,
      message: "No se pudo completar el inicio de sesion con Google.",
    });
  }
}
