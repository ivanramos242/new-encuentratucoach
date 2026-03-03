import { createHash, randomBytes } from "node:crypto";
import type { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type SessionImpersonation = {
  active: true;
  adminUserId: string;
  adminEmail: string;
  adminDisplayName: string | null;
};

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  displayName: string | null;
  coachProfileId?: string;
  impersonation?: SessionImpersonation;
};

function sha256Hex(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export function getAuthCookieName() {
  return process.env.AUTH_COOKIE_NAME || "etc_session";
}

export function getSessionTtlDays() {
  const parsed = Number(process.env.AUTH_SESSION_TTL_DAYS ?? 30);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}

export function getImpersonationCookieName() {
  return process.env.AUTH_IMPERSONATION_COOKIE_NAME || "etc_impersonation";
}

function sessionExpiresAt() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + getSessionTtlDays());
  return expiresAt;
}

export function generateRawToken() {
  return randomBytes(32).toString("hex");
}

export async function createSessionForUser(userId: string, options?: { ipAddress?: string | null; userAgent?: string | null }) {
  const rawToken = generateRawToken();
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = sessionExpiresAt();

  await prisma.authSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: options?.ipAddress ?? null,
      userAgent: options?.userAgent ?? null,
    },
  });

  return { rawToken, expiresAt };
}

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function applySessionCookie(response: NextResponse, rawToken: string, expiresAt: Date) {
  response.cookies.set(getAuthCookieName(), rawToken, {
    ...baseCookieOptions(),
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(getAuthCookieName(), "", {
    ...baseCookieOptions(),
    expires: new Date(0),
  });
}

export function applyImpersonationCookie(response: NextResponse, targetUserId: string, expiresAt: Date = sessionExpiresAt()) {
  response.cookies.set(getImpersonationCookieName(), targetUserId, {
    ...baseCookieOptions(),
    expires: expiresAt,
  });
}

export function clearImpersonationCookie(response: NextResponse) {
  response.cookies.set(getImpersonationCookieName(), "", {
    ...baseCookieOptions(),
    expires: new Date(0),
  });
}

export async function setImpersonationCookieForServerAction(targetUserId: string, expiresAt: Date = sessionExpiresAt()) {
  const cookieStore = await cookies();
  cookieStore.set(getImpersonationCookieName(), targetUserId, {
    ...baseCookieOptions(),
    expires: expiresAt,
  });
}

export async function clearImpersonationCookieForServerAction() {
  const cookieStore = await cookies();
  cookieStore.set(getImpersonationCookieName(), "", {
    ...baseCookieOptions(),
    expires: new Date(0),
  });
}

function parseCookieHeader(header: string | null) {
  const map = new Map<string, string>();
  if (!header) return map;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    map.set(k, decodeURIComponent(rest.join("=") || ""));
  }
  return map;
}

type SessionUserRecord = {
  id: string;
  email: string;
  role: UserRole;
  displayName: string | null;
  isActive: boolean;
  coachProfiles: Array<{ id: string }>;
};

function toSessionUser(input: SessionUserRecord): SessionUser {
  return {
    id: input.id,
    email: input.email,
    role: input.role,
    displayName: input.displayName,
    coachProfileId: input.coachProfiles[0]?.id,
  };
}

async function getSessionUserByRawToken(rawToken: string | null | undefined): Promise<SessionUser | null> {
  if (!rawToken) return null;
  try {
    const tokenHash = sha256Hex(rawToken);
    const session = await prisma.authSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            coachProfiles: {
              // Keep the query lightweight and schema-tolerant while V3 migration is in progress.
              orderBy: { createdAt: "asc" },
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    });

    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) {
      await prisma.authSession.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }
    if (!session.user.isActive) return null;

    return toSessionUser(session.user);
  } catch (error) {
    console.error("[auth-session] Failed to resolve session user", error);
    return null;
  }
}

async function maybeResolveImpersonatedUser(
  baseUser: SessionUser | null,
  impersonatedUserId: string | null | undefined,
): Promise<SessionUser | null> {
  if (!baseUser) return null;
  if (baseUser.role !== "admin") return baseUser;

  const targetUserId = impersonatedUserId?.trim();
  if (!targetUserId || targetUserId === baseUser.id) return baseUser;

  try {
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        role: true,
        displayName: true,
        isActive: true,
        coachProfiles: {
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { id: true },
        },
      },
    });
    if (!target || !target.isActive || target.role === "admin") return baseUser;

    return {
      ...toSessionUser(target),
      impersonation: {
        active: true,
        adminUserId: baseUser.id,
        adminEmail: baseUser.email,
        adminDisplayName: baseUser.displayName,
      },
    };
  } catch (error) {
    console.error("[auth-session] Failed to resolve impersonated user", error);
    return baseUser;
  }
}

export async function getBaseSessionUserFromRequest(request: Request) {
  const parsedCookies = parseCookieHeader(request.headers.get("cookie"));
  const rawToken = parsedCookies.get(getAuthCookieName());
  return getSessionUserByRawToken(rawToken);
}

export async function getSessionUserFromRequest(request: Request) {
  const parsedCookies = parseCookieHeader(request.headers.get("cookie"));
  const rawToken = parsedCookies.get(getAuthCookieName());
  const impersonatedUserId = parsedCookies.get(getImpersonationCookieName());
  const baseUser = await getSessionUserByRawToken(rawToken);
  return maybeResolveImpersonatedUser(baseUser, impersonatedUserId);
}

export async function getBaseSessionUserFromServerCookies() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(getAuthCookieName())?.value;
  return getSessionUserByRawToken(rawToken);
}

export async function getSessionUserFromServerCookies() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(getAuthCookieName())?.value;
  const impersonatedUserId = cookieStore.get(getImpersonationCookieName())?.value;
  const baseUser = await getSessionUserByRawToken(rawToken);
  return maybeResolveImpersonatedUser(baseUser, impersonatedUserId);
}

export async function deleteSessionByRequest(request: Request) {
  const rawToken = parseCookieHeader(request.headers.get("cookie")).get(getAuthCookieName());
  if (!rawToken) return;
  const tokenHash = sha256Hex(rawToken);
  await prisma.authSession.deleteMany({ where: { tokenHash } });
}

export async function deleteSessionByRawToken(rawToken: string) {
  const tokenHash = sha256Hex(rawToken);
  await prisma.authSession.deleteMany({ where: { tokenHash } });
}

export function hashOpaqueToken(token: string) {
  return sha256Hex(token);
}
