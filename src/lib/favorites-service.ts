import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function isCoachFavoritesTableMissingError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021" &&
    String(error.meta?.modelName ?? "").toLowerCase() === "coachfavorite"
  );
}

export async function listFavoriteCoachIdsForUser(userId: string, take?: number): Promise<string[]> {
  try {
    const rows = await prisma.coachFavorite.findMany({
      where: { userId },
      select: { coachProfileId: true },
      orderBy: { createdAt: "desc" },
      ...(typeof take === "number" ? { take } : {}),
    });

    return rows.map((row) => row.coachProfileId);
  } catch (error) {
    if (isCoachFavoritesTableMissingError(error)) {
      return [];
    }
    throw error;
  }
}

export async function setFavoriteCoachForUser(input: {
  userId: string;
  coachProfileId: string;
  favorite: boolean;
}): Promise<
  | { ok: true }
  | { ok: false; code: "NOT_FOUND" | "FORBIDDEN" | "MISSING_TABLE"; message: string }
> {
  const coach = await prisma.coachProfile.findUnique({
    where: { id: input.coachProfileId },
    select: { id: true, profileStatus: true, visibilityStatus: true },
  });

  if (!coach) {
    return { ok: false, code: "NOT_FOUND", message: "Coach no encontrado." };
  }

  if (coach.profileStatus !== "published" || coach.visibilityStatus !== "active") {
    return { ok: false, code: "FORBIDDEN", message: "Este coach no esta disponible para favoritos." };
  }

  try {
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
  } catch (error) {
    if (isCoachFavoritesTableMissingError(error)) {
      return {
        ok: false,
        code: "MISSING_TABLE",
        message: "La base de datos todavia no tiene la tabla de favoritos.",
      };
    }

    throw error;
  }

  return { ok: true };
}
