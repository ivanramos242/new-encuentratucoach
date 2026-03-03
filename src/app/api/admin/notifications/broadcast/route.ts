import { z } from "zod";
import { jsonError, jsonOk, jsonServerError } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyEndpointRateLimit } from "@/lib/rate-limit";
import { createUserNotification, notifyAdminsOfPlatformEvent } from "@/lib/notification-service";

const schema = z.object({
  mode: z.enum(["segment", "selected"]).default("segment"),
  audience: z.enum(["coaches", "clients", "both"]).optional(),
  selectedUserIds: z.array(z.string().min(1)).max(500).optional().default([]),
  subject: z.string().trim().min(3).max(180),
  message: z.string().trim().min(10).max(8000),
  includeInApp: z.boolean().optional().default(true),
}).superRefine((data, ctx) => {
  if (data.mode === "segment" && !data.audience) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["audience"],
      message: "Debes indicar la audiencia para el envio segmentado.",
    });
  }
  if (data.mode === "selected" && (!data.selectedUserIds || data.selectedUserIds.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["selectedUserIds"],
      message: "Debes seleccionar al menos un usuario.",
    });
  }
});

function isCoachLike(user: { role: "admin" | "coach" | "client"; coachProfiles: Array<{ id: string }> }) {
  return user.role === "coach" || user.coachProfiles.length > 0;
}

export async function POST(request: Request) {
  try {
    const rateLimited = applyEndpointRateLimit(request, {
      namespace: "admin-notification-broadcast",
      limit: 6,
      windowMs: 60_000,
      message: "Demasiados envios masivos en poco tiempo.",
    });
    if (rateLimited) return rateLimited;

    const auth = await requireApiRole(request, "admin");
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { not: "admin" },
      },
      select: {
        id: true,
        role: true,
        email: true,
        displayName: true,
        coachProfiles: {
          take: 1,
          select: { id: true },
        },
      },
      orderBy: [{ createdAt: "asc" }],
    });

    const selectedIds = new Set(parsed.data.selectedUserIds);
    const recipients = users.filter((user) => {
      if (parsed.data.mode === "selected") {
        return selectedIds.has(user.id);
      }
      const coachLike = isCoachLike(user);
      if (parsed.data.audience === "coaches") return coachLike;
      if (parsed.data.audience === "clients") return !coachLike;
      return true;
    });
    if (!recipients.length) {
      return jsonError("No hay destinatarios para los filtros seleccionados.", 400);
    }

    const channels = parsed.data.includeInApp ? (["email", "in_app"] as const) : (["email"] as const);

    let processed = 0;
    let emailQueued = 0;
    let inAppCreated = 0;
    for (const recipient of recipients) {
      const result = await createUserNotification({
        userId: recipient.id,
        type: "admin_mass_email",
        title: parsed.data.subject,
        body: parsed.data.message,
        channels: [...channels],
        data: {
          sentByAdminUserId: auth.user.id,
          mode: parsed.data.mode,
          audience: parsed.data.audience || "selected",
          recipientUserId: recipient.id,
          linkPath: "/mi-cuenta",
          linkLabel: "Abrir mi cuenta",
        },
        email: {
          subject: parsed.data.subject,
          text: parsed.data.message,
        },
      });
      processed += 1;
      if (result.emailQueued) emailQueued += 1;
      if (result.inAppCreated) inAppCreated += 1;
    }

    await notifyAdminsOfPlatformEvent({
      event: "admin.broadcast.sent",
      title: "Envio masivo ejecutado",
      body:
        parsed.data.mode === "selected"
          ? `Envio personalizado: ${processed} destinatarios procesados.`
          : `Broadcast a ${parsed.data.audience}: ${processed} destinatarios procesados.`,
      data: {
        mode: parsed.data.mode,
        audience: parsed.data.audience,
        selectedCount: parsed.data.selectedUserIds.length,
        processed,
        emailQueued,
        inAppCreated,
        sentBy: auth.user.email,
      },
      linkPath: "/admin/notificaciones",
    });

    return jsonOk({
      message: "Envio masivo encolado correctamente.",
      mode: parsed.data.mode,
      audience: parsed.data.audience,
      selectedCount: parsed.data.selectedUserIds.length,
      processed,
      emailQueued,
      inAppCreated,
      skippedByPreference: processed - emailQueued,
    });
  } catch (error) {
    console.error("[admin/notifications/broadcast] error", error);
    return jsonServerError("No se pudo completar el envio masivo", error);
  }
}
