import { createHash } from "node:crypto";
import type { Notification, NotificationChannel, NotificationType, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSiteBaseUrl } from "@/lib/site-config";
import { enqueueEmailJob } from "@/lib/job-queue-service";

type NotificationAudience = "client" | "coach" | "admin" | "all";

type NotificationCatalogItem = {
  type: NotificationType;
  group: string;
  label: string;
  description: string;
  audience: NotificationAudience;
  defaultInApp: boolean;
  defaultEmail: boolean;
};

export const NOTIFICATION_TYPES = [
  "account_registered",
  "account_welcome",
  "message_new",
  "message_reply",
  "pending_message_reminder",
  "message_thread_reported",
  "qa_question_answered",
  "qa_answer_accepted",
  "qa_content_reported",
  "qa_content_moderated",
  "review_new_pending",
  "review_coach_action_required",
  "subscription_checkout_started",
  "subscription_activated",
  "subscription_payment_succeeded",
  "subscription_payment_failed",
  "subscription_renewed",
  "subscription_canceled",
  "subscription_resumed",
  "subscription_state_changed",
  "admin_mass_email",
  "admin_activity_alert",
  "system_announcement",
] as const satisfies readonly NotificationType[];

const NOTIFICATION_CATALOG: NotificationCatalogItem[] = [
  {
    type: "account_registered",
    group: "Cuenta",
    label: "Registro creado",
    description: "Confirmacion de alta de cuenta.",
    audience: "all",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "account_welcome",
    group: "Cuenta",
    label: "Bienvenida y confirmaciones",
    description: "Mensajes de bienvenida y onboarding.",
    audience: "all",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "message_new",
    group: "Mensajes",
    label: "Nuevo mensaje",
    description: "Alguien te escribe en el chat interno.",
    audience: "all",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "message_reply",
    group: "Mensajes",
    label: "Respuesta en conversacion",
    description: "Recibes una respuesta en un hilo abierto.",
    audience: "all",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "pending_message_reminder",
    group: "Mensajes",
    label: "Mensaje pendiente por responder",
    description: "Recordatorio cuando hay mensajes sin respuesta.",
    audience: "all",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "message_thread_reported",
    group: "Moderacion",
    label: "Reporte de mensajeria",
    description: "Reporte de hilo o mensaje para moderacion.",
    audience: "admin",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "qa_question_answered",
    group: "Q&A",
    label: "Pregunta respondida",
    description: "Una pregunta tuya recibio respuesta.",
    audience: "all",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "qa_answer_accepted",
    group: "Q&A",
    label: "Respuesta aceptada",
    description: "Tu respuesta fue aceptada por el autor.",
    audience: "coach",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "qa_content_reported",
    group: "Moderacion",
    label: "Contenido reportado",
    description: "Se reporto contenido de Pregunta a un coach.",
    audience: "admin",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "qa_content_moderated",
    group: "Moderacion",
    label: "Contenido moderado",
    description: "Cambios de moderacion sobre contenido publicado.",
    audience: "all",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "review_new_pending",
    group: "Resenas",
    label: "Nueva resena pendiente",
    description: "Nueva resena esperando revision.",
    audience: "coach",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "review_coach_action_required",
    group: "Resenas",
    label: "Accion requerida en resena",
    description: "La resena necesita una accion de tu parte.",
    audience: "coach",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "subscription_checkout_started",
    group: "Membresia",
    label: "Checkout iniciado",
    description: "Has iniciado el proceso de pago.",
    audience: "coach",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "subscription_activated",
    group: "Membresia",
    label: "Membresia activada",
    description: "Tu membresia ha quedado activa.",
    audience: "coach",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "subscription_payment_succeeded",
    group: "Membresia",
    label: "Pago confirmado",
    description: "Pago de membresia confirmado.",
    audience: "coach",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "subscription_payment_failed",
    group: "Membresia",
    label: "Pago fallido",
    description: "No se pudo cobrar la membresia.",
    audience: "coach",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "subscription_renewed",
    group: "Membresia",
    label: "Renovacion mensual/anual",
    description: "Renovacion periodica de membresia.",
    audience: "coach",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "subscription_canceled",
    group: "Membresia",
    label: "Membresia cancelada",
    description: "Confirmaciones de cancelacion.",
    audience: "coach",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "subscription_resumed",
    group: "Membresia",
    label: "Renovacion reactivada",
    description: "Confirmaciones de reactivacion.",
    audience: "coach",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "subscription_state_changed",
    group: "Membresia",
    label: "Cambios de estado de membresia",
    description: "Actualizaciones generales de estado de suscripcion.",
    audience: "coach",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "admin_mass_email",
    group: "Comunicados",
    label: "Emails del equipo",
    description: "Comunicados enviados desde administracion.",
    audience: "all",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "admin_activity_alert",
    group: "Admin",
    label: "Alertas operativas",
    description: "Alertas de actividad de la plataforma para administracion.",
    audience: "admin",
    defaultInApp: true,
    defaultEmail: true,
  },
  {
    type: "system_announcement",
    group: "Sistema",
    label: "Actualizaciones del sistema",
    description: "Cambios de producto o anuncios generales.",
    audience: "all",
    defaultInApp: true,
    defaultEmail: false,
  },
];

const CATALOG_BY_TYPE = new Map<NotificationType, NotificationCatalogItem>(NOTIFICATION_CATALOG.map((item) => [item.type, item]));
const FALLBACK_ADMIN_EMAIL = "ivanramos242@gmail.com";

function stableHash(input: string) {
  return createHash("sha256").update(input).digest("hex").slice(0, 24);
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeEmailList(input?: string | null) {
  if (!input) return [];
  return input
    .split(/[;,]/g)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function extractJsonObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function catalogForRole(role: UserRole) {
  if (role === "admin") {
    return NOTIFICATION_CATALOG.filter((item) => item.audience === "all" || item.audience === "admin");
  }
  return NOTIFICATION_CATALOG.filter((item) => item.audience === "all" || item.audience === "client" || item.audience === "coach");
}

function catalogItemForType(type: NotificationType) {
  return CATALOG_BY_TYPE.get(type);
}

function prefKey(type: NotificationType, channel: NotificationChannel) {
  return `${type}:${channel}`;
}

async function ensureDefaultPreferencesForUser(userId: string, role: UserRole) {
  const items = catalogForRole(role);
  if (!items.length) return;
  await prisma.notificationPreference.createMany({
    data: items.flatMap((item) => [
      {
        userId,
        type: item.type,
        channel: "in_app",
        enabled: item.defaultInApp,
        digestMode: "instant",
      },
      {
        userId,
        type: item.type,
        channel: "email",
        enabled: item.defaultEmail,
        digestMode: "instant",
      },
    ]),
    skipDuplicates: true,
  });
}

async function getPreferenceMapForUser(userId: string, role: UserRole) {
  await ensureDefaultPreferencesForUser(userId, role);
  const allowed = catalogForRole(role).map((item) => item.type);
  const rows = await prisma.notificationPreference.findMany({
    where: {
      userId,
      type: { in: allowed },
    },
  });
  return new Map(rows.map((row) => [prefKey(row.type, row.channel), row.enabled]));
}

function isChannelEnabledForType(input: {
  type: NotificationType;
  channel: NotificationChannel;
  prefMap: Map<string, boolean>;
}) {
  const catalog = catalogItemForType(input.type);
  const fallback = input.channel === "in_app" ? Boolean(catalog?.defaultInApp) : Boolean(catalog?.defaultEmail);
  return input.prefMap.get(prefKey(input.type, input.channel)) ?? fallback;
}

function buildDefaultNotificationEmail(input: {
  title: string;
  body: string;
  linkPath?: string;
  linkLabel?: string;
}) {
  const baseUrl = getSiteBaseUrl();
  const linkPath = input.linkPath?.trim();
  const targetUrl = linkPath
    ? linkPath.startsWith("http://") || linkPath.startsWith("https://")
      ? linkPath
      : `${baseUrl}${linkPath.startsWith("/") ? linkPath : `/${linkPath}`}`
    : "";
  const linkLabel = input.linkLabel?.trim() || "Abrir en EncuentraTuCoach";

  const title = escapeHtml(input.title);
  const safeBody = escapeHtml(input.body).replace(/\n/g, "<br />");
  const html = `
    <div style="font-family:Arial,sans-serif;background:#f4f4f5;padding:24px">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:24px">
        <p style="margin:0 0 8px;font-size:12px;color:#71717a;letter-spacing:.04em;text-transform:uppercase">EncuentraTuCoach</p>
        <h1 style="margin:0 0 12px;font-size:22px;color:#09090b">${title}</h1>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#27272a">${safeBody}</p>
        ${
          targetUrl
            ? `<p style="margin:18px 0 0"><a href="${escapeHtml(targetUrl)}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;font-size:14px;font-weight:600">${escapeHtml(linkLabel)}</a></p>`
            : ""
        }
      </div>
    </div>
  `.trim();

  const textParts = [input.title, "", input.body];
  if (targetUrl) textParts.push("", `${linkLabel}: ${targetUrl}`);
  return {
    subject: `[EncuentraTuCoach] ${input.title}`,
    text: textParts.join("\n"),
    html,
  };
}

export function getNotificationCatalog(role: UserRole) {
  return catalogForRole(role);
}

export async function listNotificationPreferencesForUser(input: { userId: string; role: UserRole }) {
  await ensureDefaultPreferencesForUser(input.userId, input.role);
  const types = catalogForRole(input.role).map((item) => item.type);
  const rows = await prisma.notificationPreference.findMany({
    where: {
      userId: input.userId,
      type: { in: types },
    },
    orderBy: [{ type: "asc" }, { channel: "asc" }],
  });

  return rows.map((row) => {
    const meta = catalogItemForType(row.type);
    return {
      ...row,
      group: meta?.group || "Sistema",
      label: meta?.label || row.type,
      description: meta?.description || "",
    };
  });
}

export async function upsertNotificationPreferencesForUser(input: {
  userId: string;
  role: UserRole;
  items: Array<{ type: NotificationType; channel: NotificationChannel; enabled: boolean }>;
}) {
  const allowedTypes = new Set(catalogForRole(input.role).map((item) => item.type));
  const filtered = input.items.filter((item) => allowedTypes.has(item.type));
  if (!filtered.length) return [];

  await Promise.all(
    filtered.map((item) =>
      prisma.notificationPreference.upsert({
        where: {
          userId_type_channel: {
            userId: input.userId,
            type: item.type,
            channel: item.channel,
          },
        },
        create: {
          userId: input.userId,
          type: item.type,
          channel: item.channel,
          enabled: item.enabled,
          digestMode: "instant",
        },
        update: { enabled: item.enabled },
      }),
    ),
  );

  return listNotificationPreferencesForUser({ userId: input.userId, role: input.role });
}

export async function createUserNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  dedupeKey?: string;
  channels?: NotificationChannel[];
  email?: {
    subject?: string;
    html?: string;
    text?: string;
    replyTo?: string;
    dedupeKey?: string;
  };
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) {
    return { notification: null as Notification | null, emailQueued: false, inAppCreated: false };
  }

  const requestedChannels = new Set<NotificationChannel>(input.channels?.length ? input.channels : ["in_app", "email"]);
  const preferenceMap = await getPreferenceMapForUser(user.id, user.role);
  const dedupeWindowSeconds = Number(process.env.NOTIFICATION_EMAIL_DEDUPE_WINDOW_SECONDS ?? 300);

  if (input.dedupeKey?.trim() && Number.isFinite(dedupeWindowSeconds) && dedupeWindowSeconds > 0) {
    const since = new Date(Date.now() - dedupeWindowSeconds * 1000);
    const recent = await prisma.notification.findMany({
      where: {
        userId: user.id,
        type: input.type,
        createdAt: { gte: since },
      },
      select: { data: true },
    });
    const dedupeKey = input.dedupeKey.trim();
    const duplicated = recent.some((item) => {
      const data = extractJsonObject(item.data);
      return data._dedupeKey === dedupeKey;
    });
    if (duplicated) {
      return { notification: null as Notification | null, emailQueued: false, inAppCreated: false, deduped: true };
    }
  }

  const inAppEnabled =
    requestedChannels.has("in_app") && isChannelEnabledForType({ type: input.type, channel: "in_app", prefMap: preferenceMap });
  const emailEnabled =
    requestedChannels.has("email") && isChannelEnabledForType({ type: input.type, channel: "email", prefMap: preferenceMap });

  let notification: Notification | null = null;
  if (inAppEnabled) {
    notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: input.type,
        title: input.title,
        body: input.body,
        data: {
          ...(input.data ?? {}),
          ...(input.dedupeKey?.trim() ? { _dedupeKey: input.dedupeKey.trim() } : {}),
        } as Prisma.JsonObject,
      },
    });
  }

  let emailQueued = false;
  if (emailEnabled) {
    const fallbackEmail = buildDefaultNotificationEmail({
      title: input.title,
      body: input.body,
      linkPath: typeof input.data?.linkPath === "string" ? input.data.linkPath : undefined,
      linkLabel: typeof input.data?.linkLabel === "string" ? input.data.linkLabel : undefined,
    });
    const dedupeKey =
      input.email?.dedupeKey ??
      input.dedupeKey ??
      `email:${user.id}:${input.type}:${stableHash(`${input.title}|${input.body}|${JSON.stringify(input.data ?? {})}`)}`;

    await enqueueEmailJob({
      to: user.email,
      subject: input.email?.subject || fallbackEmail.subject,
      html: input.email?.html || fallbackEmail.html,
      text: input.email?.text || fallbackEmail.text,
      replyTo: input.email?.replyTo,
      notificationId: notification?.id,
      dedupeKey,
      metadata: {
        userId: user.id,
        type: input.type,
      },
    });
    emailQueued = true;
  }

  return {
    notification,
    emailQueued,
    inAppCreated: Boolean(notification),
    deduped: false,
  };
}

export async function listNotificationsForUser(userId: string, options?: { limit?: number }) {
  const limit = options?.limit ?? 80;
  return prisma.notification.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });
}

export async function pollNotificationsForUser(userId: string, since?: string | null, options?: { limit?: number }) {
  const parsedSince = since ? new Date(since) : null;
  const validSince = parsedSince && !Number.isNaN(parsedSince.getTime()) ? parsedSince : null;
  const limit = options?.limit ?? 80;
  const items = await prisma.notification.findMany({
    where: {
      userId,
      ...(validSince ? { createdAt: { gt: validSince } } : {}),
    },
    orderBy: [{ createdAt: "asc" }],
    take: limit,
  });

  return {
    items,
    serverTime: new Date().toISOString(),
  };
}

export async function markNotificationReadForUser(input: { userId: string; notificationId: string }) {
  const existing = await prisma.notification.findFirst({
    where: { id: input.notificationId, userId: input.userId },
    select: { id: true },
  });
  if (!existing) return { error: "Notificacion no encontrada." as const };

  const notification = await prisma.notification.update({
    where: { id: input.notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
  return { notification };
}

export async function markAllNotificationsReadForUser(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return { affected: result.count };
}

function buildAdminAlertMessage(input: {
  title: string;
  body: string;
  event: string;
  data?: Record<string, unknown>;
}) {
  const details = input.data ? `\n\nDatos:\n${JSON.stringify(input.data, null, 2)}` : "";
  return {
    subject: `[Admin Alert] ${input.title}`,
    text: `${input.body}\n\nEvento: ${input.event}${details}`,
    html: `<p>${escapeHtml(input.body).replace(/\n/g, "<br />")}</p><p><strong>Evento:</strong> ${escapeHtml(input.event)}</p>${
      input.data
        ? `<pre style="background:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:12px;white-space:pre-wrap">${escapeHtml(JSON.stringify(input.data, null, 2))}</pre>`
        : ""
    }`,
  };
}

export function getAdminAlertRecipients() {
  const fromEnv = normalizeEmailList(process.env.ADMIN_ALERTS_TO);
  return Array.from(new Set([...fromEnv, FALLBACK_ADMIN_EMAIL]));
}

export async function notifyAdminsOfPlatformEvent(input: {
  event: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  linkPath?: string;
}) {
  const admins = await prisma.user.findMany({
    where: { role: "admin", isActive: true },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      createUserNotification({
        userId: admin.id,
        type: "admin_activity_alert",
        title: input.title,
        body: input.body,
        data: {
          event: input.event,
          ...(input.linkPath ? { linkPath: input.linkPath } : {}),
          ...(input.data ?? {}),
        },
      }),
    ),
  );

  const recipients = getAdminAlertRecipients();
  if (!recipients.length) return { deliveredTo: 0 };

  const emailPayload = buildAdminAlertMessage({
    title: input.title,
    body: input.body,
    event: input.event,
    data: input.data,
  });

  await Promise.all(
    recipients.map((email) =>
      enqueueEmailJob({
        to: email,
        subject: emailPayload.subject,
        html: emailPayload.html,
        text: emailPayload.text,
        dedupeKey: `admin-alert:${input.event}:${stableHash(`${emailPayload.subject}|${emailPayload.text}`)}`,
        metadata: {
          event: input.event,
        },
      }),
    ),
  );

  return { deliveredTo: recipients.length };
}
