import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  coachId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(5).max(2000),
});

export async function POST(request: Request) {
  try {
    const auth = await requireApiSession(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Datos de reseña no válidos.", 400, { issues: parsed.error.flatten() });
    }

    const coach = await prisma.coachProfile.findUnique({
      where: { id: parsed.data.coachId },
      select: {
        id: true,
        name: true,
        slug: true,
        userId: true,
        profileStatus: true,
        visibilityStatus: true,
      },
    });
    if (!coach) return jsonError("Coach no encontrado.", 404);
    if (coach.profileStatus !== "published" || coach.visibilityStatus !== "active") {
      return jsonError("Solo puedes reseñar perfiles publicados.", 400);
    }
    if (coach.userId && coach.userId === auth.user.id) {
      return jsonError("No puedes dejar una reseña en tu propio perfil.", 400);
    }

    const existing = await prisma.review.findUnique({
      where: {
        coachProfileId_clientUserId: {
          coachProfileId: coach.id,
          clientUserId: auth.user.id,
        },
      },
      select: { id: true },
    });

    const review = await prisma.review.upsert({
      where: {
        coachProfileId_clientUserId: {
          coachProfileId: coach.id,
          clientUserId: auth.user.id,
        },
      },
      create: {
        coachProfileId: coach.id,
        clientUserId: auth.user.id,
        title: null,
        body: parsed.data.body,
        coachDecision: "approved",
        adminDecision: "approved",
        isVisible: true,
        rating: {
          create: {
            overall: parsed.data.rating,
          },
        },
      },
      update: {
        title: null,
        body: parsed.data.body,
        coachDecision: "approved",
        adminDecision: "approved",
        isVisible: true,
        rating: {
          upsert: {
            create: { overall: parsed.data.rating },
            update: { overall: parsed.data.rating },
          },
        },
      },
      include: {
        rating: true,
      },
    });

    await prisma.reviewAuditLog.create({
      data: {
        reviewId: review.id,
        actorUserId: auth.user.id,
        action: existing ? "review_updated_auto_approved" : "review_created_auto_approved",
        note: "Reseña publicada automáticamente.",
      },
    }).catch(() => undefined);

    return jsonOk({
      message: existing ? "Reseña actualizada y publicada." : "Reseña publicada correctamente.",
      review: {
        id: review.id,
        coachId: coach.id,
        coachSlug: coach.slug,
        coachName: coach.name,
        rating: review.rating?.overall ?? parsed.data.rating,
        body: review.body,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[reviews/create] POST failed", error);
    return jsonError("No se pudo guardar la reseña.", 500);
  }
}
