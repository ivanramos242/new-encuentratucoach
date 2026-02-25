import type { Prisma } from "@prisma/client";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import {
  CoachUserLinker,
  type CoachUserLinkerCoachRow,
  type CoachUserLinkerUserOption,
} from "@/components/admin/coach-user-linker";
import { prisma } from "@/lib/prisma";

function asRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumberLikeString(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

export default async function AdminCoachesPage() {
  const [coachesRaw, usersRaw, legacyMaps] = await Promise.all([
    prisma.coachProfile.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        profileStatus: true,
        visibilityStatus: true,
        userId: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ userId: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        coachProfiles: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ role: "asc" }, { email: "asc" }],
    }),
    prisma.legacyImportMap.findMany({
      where: {
        targetTable: "CoachProfile",
        sourceType: "coach_post",
      },
      select: {
        targetId: true,
        sourceId: true,
        payload: true,
      },
    }),
  ]);

  const legacyByCoachId = new Map(
    legacyMaps.map((map) => {
      const payload = asRecord(map.payload);
      return [
        map.targetId,
        {
          wpPostId: asNumberLikeString(payload?.wpPostId) ?? map.sourceId,
          wpPostAuthor: asNumberLikeString(payload?.wpPostAuthor),
          wpStatus: asString(payload?.wpStatus),
          sourceEmail: asString(payload?.sourceEmail)?.toLowerCase() ?? null,
          sourceUserIdField: asNumberLikeString(payload?.sourceUserIdField),
          wpPermalink: asString(payload?.wpPermalink),
        },
      ];
    }),
  );

  const userByEmail = new Map(usersRaw.map((user) => [user.email.trim().toLowerCase(), user]));

  const users: CoachUserLinkerUserOption[] = usersRaw.map((user) => ({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
    coachProfiles: user.coachProfiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      slug: profile.slug,
    })),
  }));

  const coaches: CoachUserLinkerCoachRow[] = coachesRaw.map((coach) => {
    const legacy = legacyByCoachId.get(coach.id) ?? null;
    const suggestedUser =
      legacy?.sourceEmail && !coach.userId ? userByEmail.get(legacy.sourceEmail) ?? null : null;

    return {
      id: coach.id,
      name: coach.name,
      slug: coach.slug,
      profileStatus: coach.profileStatus,
      visibilityStatus: coach.visibilityStatus,
      updatedAtIso: coach.updatedAt.toISOString(),
      owner: coach.owner
        ? {
            id: coach.owner.id,
            email: coach.owner.email,
            displayName: coach.owner.displayName,
            role: coach.owner.role,
            isActive: coach.owner.isActive,
          }
        : null,
      legacy: legacy
        ? {
            wpPostId: legacy.wpPostId,
            wpPostAuthor: legacy.wpPostAuthor,
            wpStatus: legacy.wpStatus,
            sourceEmail: legacy.sourceEmail,
            sourceUserIdField: legacy.sourceUserIdField,
            wpPermalink: legacy.wpPermalink,
          }
        : null,
      suggestedUserId: suggestedUser?.id ?? null,
      suggestedUserLabel: suggestedUser
        ? `${suggestedUser.displayName || suggestedUser.email} (${suggestedUser.email})`
        : null,
    };
  });

  return (
    <>
      <PageHero
        badge="Admin"
        title="Coaches - Gestion y edicion"
        description="Vincula perfiles con usuarios y abre el editor admin para revisar datos publicos y campos internos."
      />
      <PageShell className="pt-8">
        <CoachUserLinker coaches={coaches} users={users} />
      </PageShell>
    </>
  );
}

