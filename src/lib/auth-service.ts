import { randomBytes } from "node:crypto";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { hashPassword, verifyPasswordHash } from "@/lib/auth-password";
import { createSessionForUser, hashOpaqueToken } from "@/lib/auth-session";
import { sendMail } from "@/lib/mailer";
import { siteConfig } from "@/lib/site-config";

// Small shim imports to avoid circular deps between auth-session and auth-password.

type RegisterInput = {
  email: string;
  password: string;
  displayName?: string | null;
  role: UserRole;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildBaseName(input: { displayName?: string | null; email: string }) {
  return (input.displayName || input.email.split("@")[0] || "Coach").trim();
}

async function uniqueCoachSlug(base: string, findBySlug: (slug: string) => Promise<{ id: string } | null>) {
  const normalized = slugify(base) || "coach";
  let slug = normalized;
  let i = 2;
  while (await findBySlug(slug)) {
    slug = `${normalized}-${i++}`;
  }
  return slug;
}

export async function registerUser(input: RegisterInput) {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { error: "Ya existe una cuenta con ese email." as const };
  }

  const passwordHash = await hashPassword(input.password);
  const displayName = input.displayName?.trim() || null;

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        role: input.role,
        isActive: true,
        mustResetPassword: false,
      },
    });

    let coachProfileId: string | undefined;
    if (input.role === "coach") {
      const name = buildBaseName({ displayName, email });
      const slug = await uniqueCoachSlug(name, (slug) => tx.coachProfile.findUnique({ where: { slug }, select: { id: true } }));
      const coach = await tx.coachProfile.create({
        data: {
          userId: user.id,
          name,
          slug,
          profileStatus: "draft",
          visibilityStatus: "inactive",
          certifiedStatus: "none",
        },
        select: { id: true },
      });
      coachProfileId = coach.id;
    }

    return { user, coachProfileId };
  });

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      displayName: result.user.displayName,
      coachProfileId: result.coachProfileId,
    },
  };
}

export async function loginUser(input: { email: string; password: string; ipAddress?: string | null; userAgent?: string | null }) {
  const email = normalizeEmail(input.email);
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      coachProfiles: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: { id: true },
      },
    },
  });

  if (!user || !user.passwordHash) return { error: "Credenciales incorrectas." as const };
  if (!user.isActive) return { error: "La cuenta esta desactivada." as const };
  if (user.mustResetPassword) {
    return {
      error: "Debes restablecer tu contraseña antes de iniciar sesión. Usa 'Recuperar contraseña' con este email.",
      code: "PASSWORD_RESET_REQUIRED" as const,
    };
  }

  const ok = await verifyPasswordHash(user.passwordHash, input.password);
  if (!ok) return { error: "Credenciales incorrectas." as const };

  const session = await createSessionForUser(user.id, {
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  });

  return {
    session,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      coachProfileId: user.coachProfiles[0]?.id,
    },
  };
}

function generateResetTokenRaw() {
  return randomBytes(32).toString("hex");
}

function getResetTtlMinutes() {
  return 60;
}

export async function createPasswordResetRequest(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
  if (!user) {
    return { ok: true as const, delivered: false as const };
  }

  const rawToken = generateResetTokenRaw();
  const tokenHash = hashOpaqueToken(rawToken);
  const expiresAt = new Date(Date.now() + getResetTtlMinutes() * 60_000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
  const resetUrl = `${baseUrl}/recuperar-contrasena?token=${encodeURIComponent(rawToken)}`;

  const mailResult = await sendMail({
    to: user.email,
    subject: "Recupera tu contraseña · EncuentraTuCoach",
    text: `Para restablecer tu contraseña, abre este enlace: ${resetUrl}`,
    html: `<p>Para restablecer tu contraseña, haz clic en este enlace:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Caduca en ${getResetTtlMinutes()} minutos.</p>`,
  });

  return {
    ok: true as const,
    delivered: mailResult.delivered,
    // Solo expuesto en desarrollo para facilitar pruebas.
    debugResetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
  };
}

export async function resetPasswordWithToken(input: { token: string; newPassword: string }) {
  const tokenHash = hashOpaqueToken(input.token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record) return { error: "Token de recuperación no válido." as const };
  if (record.usedAt) return { error: "Este token ya ha sido utilizado." as const };
  if (record.expiresAt.getTime() <= Date.now()) return { error: "El token ha caducado." as const };
  if (!record.user.isActive) return { error: "La cuenta está desactivada." as const };

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, mustResetPassword: false },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.authSession.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { ok: true as const };
}
