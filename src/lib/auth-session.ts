import { createHash, randomBytes } from "node:crypto";
import type { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  displayName: string | null;
  coachProfileId?: string;
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

export function applySessionCookie(response: NextResponse, rawToken: string, expiresAt: Date) {
  response.cookies.set(getAuthCookieName(), rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(getAuthCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
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

    return {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      displayName: session.user.displayName,
      coachProfileId: session.user.coachProfiles[0]?.id,
    };
  } catch (error) {
    console.error("[auth-session] Failed to resolve session user", error);
    return null;
  }
}

export async function getSessionUserFromRequest(request: Request) {
  const rawToken = parseCookieHeader(request.headers.get("cookie")).get(getAuthCookieName());
  return getSessionUserByRawToken(rawToken);
}

export async function getSessionUserFromServerCookies() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(getAuthCookieName())?.value;
  return getSessionUserByRawToken(rawToken);
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
