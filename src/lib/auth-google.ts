import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getSiteBaseUrl } from "@/lib/site-config";

const GOOGLE_AUTHORIZE_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

export type GoogleAuthIntent = "login" | "client" | "coach";

type GoogleOAuthStatePayload = {
  state: string;
  codeVerifier: string;
  intent: GoogleAuthIntent;
  returnTo: string;
  createdAtMs: number;
};

export type GoogleOAuthProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
};

export function getGoogleOauthCookieName() {
  return process.env.GOOGLE_OAUTH_COOKIE_NAME || "etc_google_oauth";
}

export function getGoogleOauthCookieMaxAgeSeconds() {
  return 10 * 60;
}

export function parseGoogleAuthIntent(raw: string | null | undefined): GoogleAuthIntent {
  if (raw === "coach") return "coach";
  if (raw === "client") return "client";
  return "login";
}

export function sanitizeReturnToPath(raw: string | null | undefined, fallback: string) {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  return trimmed;
}

export function getGoogleOauthDefaultReturnTo(intent: GoogleAuthIntent) {
  if (intent === "coach") return "/membresia";
  return "/mi-cuenta";
}

export function getGoogleOauthRedirectUri() {
  const fromEnv = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;
  return `${getSiteBaseUrl()}/api/auth/google/callback`;
}

export function getGoogleClientId() {
  const value = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!value) throw new Error("Missing GOOGLE_CLIENT_ID");
  return value;
}

function getGoogleClientSecret() {
  const value = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!value) throw new Error("Missing GOOGLE_CLIENT_SECRET");
  return value;
}

function getGoogleOauthStateSecret() {
  const value = process.env.AUTH_OAUTH_STATE_SECRET?.trim();
  if (!value) throw new Error("Missing AUTH_OAUTH_STATE_SECRET");
  return value;
}

function sha256Base64Url(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

function signStatePayload(encodedPayload: string) {
  return createHmac("sha256", getGoogleOauthStateSecret()).update(encodedPayload).digest("base64url");
}

function encodeStatePayload(payload: GoogleOAuthStatePayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signStatePayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function decodeStatePayload(value: string | null | undefined) {
  if (!value) return null;
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signStatePayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as GoogleOAuthStatePayload;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildGoogleOauthStart(input: { intent: GoogleAuthIntent; returnTo: string }) {
  const state = randomBytes(24).toString("hex");
  const codeVerifier = randomBytes(48).toString("base64url");
  const codeChallenge = sha256Base64Url(codeVerifier);
  const redirectUri = getGoogleOauthRedirectUri();

  const authorizationUrl = new URL(GOOGLE_AUTHORIZE_ENDPOINT);
  authorizationUrl.searchParams.set("client_id", getGoogleClientId());
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("include_granted_scopes", "true");

  const cookieValue = encodeStatePayload({
    state,
    codeVerifier,
    intent: input.intent,
    returnTo: input.returnTo,
    createdAtMs: Date.now(),
  });

  return {
    authorizationUrl: authorizationUrl.toString(),
    cookieValue,
  };
}

export function readGoogleOauthStateCookie(rawCookieValue: string | null | undefined) {
  const payload = decodeStatePayload(rawCookieValue);
  if (!payload) return null;
  const ageMs = Date.now() - payload.createdAtMs;
  if (ageMs < 0 || ageMs > getGoogleOauthCookieMaxAgeSeconds() * 1000) return null;
  return payload;
}

export async function exchangeGoogleCodeForTokens(input: { code: string; codeVerifier: string }) {
  const body = new URLSearchParams();
  body.set("code", input.code);
  body.set("client_id", getGoogleClientId());
  body.set("client_secret", getGoogleClientSecret());
  body.set("redirect_uri", getGoogleOauthRedirectUri());
  body.set("grant_type", "authorization_code");
  body.set("code_verifier", input.codeVerifier);

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as
    | {
        access_token?: string;
        error?: string;
        error_description?: string;
      }
    | null;

  if (!response.ok || !json?.access_token) {
    throw new Error(
      json?.error_description || json?.error || `Google token exchange failed with status ${response.status}`,
    );
  }

  return { accessToken: json.access_token };
}

function parseEmailVerified(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

export async function fetchGoogleOpenIdProfile(accessToken: string): Promise<GoogleOAuthProfile> {
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as
    | {
        sub?: string;
        email?: string;
        email_verified?: boolean | string;
        name?: string;
        picture?: string;
      }
    | null;

  if (!response.ok || !json?.sub || !json.email) {
    throw new Error(`Google userinfo failed with status ${response.status}`);
  }

  return {
    sub: json.sub,
    email: json.email.trim().toLowerCase(),
    emailVerified: parseEmailVerified(json.email_verified),
    name: json.name?.trim() || null,
    picture: json.picture?.trim() || null,
  };
}
