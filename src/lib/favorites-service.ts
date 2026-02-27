import { prisma } from "@/lib/prisma";

export async function listFavoriteCoachIdsForUser(userId: string): Promise<string[]> {
  const rows = await prisma.coachFavorite.findMany({
    where: { userId },
    select: { coachProfileId: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => row.coachProfileId);
}

export async function setFavoriteCoachForUser(input: {
  userId: string;
  coachProfileId: string;
  favorite: boolean;
}) {
  const coach = await prisma.coachProfile.findUnique({
    where: { id: input.coachProfileId },
    select: { id: true, profileStatus: true, visibilityStatus: true },
  });
  if (!coach) {
    return { ok: false as const, code: "NOT_FOUND" as const, message: "Coach no encontrado." };
  }

  if (coach.profileStatus !== "published" || coach.visibilityStatus !== "active") {
    return { ok: false as const, code: "FORBIDDEN" as const, message: "Este coach no está disponible para favoritos." };
  }

  if (input.favorite) {
    await prisma.coachFavorite.upsert({
      where: {
        userId_coachProfileId: {
          userId: input.userId,
          coachProfileId: input.coachProfileId,
        },
      },
      create: {
        userId: input.userId,
        coachProfileId: input.coachProfileId,
      },
      update: {},
    });
  } else {
    await prisma.coachFavorite.deleteMany({
      where: {
        userId: input.userId,
        coachProfileId: input.coachProfileId,
      },
    });
  }

  return { ok: true as const };
}
