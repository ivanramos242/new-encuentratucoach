import { jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

function isCoachLike(input: { role: "admin" | "coach" | "client"; coachProfiles: Array<{ id: string }> }) {
  return input.role === "coach" || input.coachProfiles.length > 0;
}

export async function GET(request: Request) {
  const auth = await requireApiRole(request, "admin");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limitRaw = Number(url.searchParams.get("limit") || 200);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 500)) : 200;

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { not: "admin" },
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { displayName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      createdAt: true,
      coachProfiles: {
        take: 1,
        select: { id: true },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });

  return jsonOk({
    recipients: users.map((user) => {
      const coachLike = isCoachLike(user);
      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        segment: coachLike ? "coaches" : "clients",
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      };
    }),
  });
}

