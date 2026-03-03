import type { NotificationType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createUserNotification, notifyAdminsOfPlatformEvent } from "@/lib/notification-service";

function displayNameOrEmail(input: { displayName?: string | null; email: string }) {
  const name = input.displayName?.trim();
  return name || input.email;
}

function extractJsonObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function sendRegistrationNotifications(input: {
  userId: string;
  userEmail: string;
  userDisplayName?: string | null;
  requestedRole?: UserRole;
}) {
  const roleLabel = input.requestedRole === "coach" ? "coach" : "cliente";
  const targetName = displayNameOrEmail({ displayName: input.userDisplayName, email: input.userEmail });

  await createUserNotification({
    userId: input.userId,
    type: "account_registered",
    title: "Tu cuenta ya esta activa",
    body: `Hola ${targetName}, ya puedes entrar en tu cuenta de EncuentraTuCoach.`,
    data: {
      linkPath: "/mi-cuenta",
      linkLabel: "Ir a mi cuenta",
    },
  });

  await createUserNotification({
    userId: input.userId,
    type: "account_welcome",
    title: "Bienvenido a EncuentraTuCoach",
    body:
      roleLabel === "coach"
        ? "Te damos la bienvenida. Completa tu perfil y activa tu membresia para empezar a captar clientes."
        : "Te damos la bienvenida. Ya puedes buscar coaches, guardar favoritos y usar el chat interno.",
    data: {
      linkPath: roleLabel === "coach" ? "/mi-cuenta/coach" : "/mi-cuenta/cliente",
      linkLabel: "Abrir panel",
    },
  });

  await notifyAdminsOfPlatformEvent({
    event: "user.registered",
    title: "Nuevo registro de usuario",
    body: `Se ha registrado un nuevo ${roleLabel}: ${input.userEmail}`,
    data: {
      userId: input.userId,
      email: input.userEmail,
      requestedRole: roleLabel,
    },
    linkPath: "/admin/usuarios",
  });
}

export async function sendConversationMessageNotification(input: {
  threadId: string;
  senderRole: "coach" | "client";
  recipientUserId: string;
  senderLabel: string;
  threadOwnerLabel: string;
}) {
  const isCoachSender = input.senderRole === "coach";
  const type: NotificationType = isCoachSender ? "message_reply" : "message_new";
  const title = isCoachSender ? "Respuesta en tu inbox" : "Nuevo mensaje en tu inbox";
  const body = isCoachSender
    ? `${input.senderLabel} ha respondido en tu conversacion.`
    : `${input.senderLabel} te ha escrito en el inbox.`;

  await createUserNotification({
    userId: input.recipientUserId,
    type,
    title,
    body,
    data: {
      threadId: input.threadId,
      senderRole: input.senderRole,
      senderLabel: input.senderLabel,
      threadOwnerLabel: input.threadOwnerLabel,
      linkPath: isCoachSender ? `/mi-cuenta/cliente/mensajes/${input.threadId}` : `/mi-cuenta/coach/mensajes/${input.threadId}`,
      linkLabel: "Abrir conversacion",
    },
  });

  await notifyAdminsOfPlatformEvent({
    event: "conversation.message",
    title: "Nuevo mensaje en mensajeria",
    body: `${input.senderLabel} envio un mensaje (${input.senderRole}) en el hilo ${input.threadId}.`,
    data: {
      threadId: input.threadId,
      senderRole: input.senderRole,
      senderLabel: input.senderLabel,
      recipientUserId: input.recipientUserId,
    },
    linkPath: "/admin/mensajes",
  });
}

type SubscriptionNotificationInput = {
  userId: string;
  type:
    | "subscription_checkout_started"
    | "subscription_activated"
    | "subscription_payment_succeeded"
    | "subscription_payment_failed"
    | "subscription_renewed"
    | "subscription_canceled"
    | "subscription_resumed"
    | "subscription_state_changed";
  title: string;
  body: string;
  data?: Record<string, unknown>;
  alertAdmin?: boolean;
};

export async function sendSubscriptionNotification(input: SubscriptionNotificationInput) {
  const dedupeBase = `${input.type}:${input.userId}:${
    input.data?.subscriptionId || input.data?.stripeSubscriptionId || input.data?.eventType || input.title
  }`;
  await createUserNotification({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    dedupeKey: `subscription:${dedupeBase}`,
    data: {
      linkPath: "/mi-cuenta/coach/membresia",
      linkLabel: "Ver membresia",
      ...(input.data ?? {}),
    },
    email: {
      dedupeKey: `subscription-email:${dedupeBase}`,
    },
  });

  if (input.alertAdmin) {
    await notifyAdminsOfPlatformEvent({
      event: `subscription.${input.type}`,
      title: `Evento de membresia: ${input.type}`,
      body: input.body,
      data: {
        userId: input.userId,
        ...(input.data ?? {}),
      },
      linkPath: "/admin/membresia",
    });
  }
}

export async function runPendingMessageReminderSweep() {
  const delayMinutes = Number(process.env.PENDING_MESSAGE_REMINDER_DELAY_MINUTES ?? 60);
  const cooldownMinutes = Number(process.env.PENDING_MESSAGE_REMINDER_COOLDOWN_MINUTES ?? 180);
  const maxPerRun = Number(process.env.PENDING_MESSAGE_REMINDER_MAX_PER_RUN ?? 100);

  const reminderThreshold = new Date(Date.now() - Math.max(delayMinutes, 5) * 60_000);
  const cooldownFloor = new Date(Date.now() - Math.max(cooldownMinutes, 10) * 60_000);

  const threads = await prisma.conversationThread.findMany({
    where: {
      status: "open",
      lastMessageAt: { lte: reminderThreshold },
    },
    orderBy: [{ lastMessageAt: "asc" }],
    take: maxPerRun,
    include: {
      coachProfile: { select: { id: true, name: true } },
      coachUser: { select: { id: true, displayName: true, email: true } },
      clientUser: { select: { id: true, displayName: true, email: true } },
      messages: {
        where: { deletedAt: null },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        select: {
          id: true,
          senderType: true,
          createdAt: true,
        },
      },
    },
  });

  let remindersQueued = 0;
  for (const thread of threads) {
    const latest = thread.messages[0];
    if (!latest) continue;
    if (latest.senderType !== "client" && latest.senderType !== "coach") continue;
    if (latest.createdAt > reminderThreshold) continue;

    const recipientUserId = latest.senderType === "client" ? thread.coachUserId : thread.clientUserId;
    const recipientRole = latest.senderType === "client" ? "coach" : "client";
    const senderName =
      latest.senderType === "client"
        ? thread.clientUser.displayName?.trim() || thread.clientUser.email
        : thread.coachProfile.name || thread.coachUser.displayName?.trim() || thread.coachUser.email;

    const recent = await prisma.notification.findMany({
      where: {
        userId: recipientUserId,
        type: "pending_message_reminder",
        createdAt: { gte: cooldownFloor },
      },
      select: { data: true },
    });

    const alreadyNotified = recent.some((row) => {
      const data = extractJsonObject(row.data);
      return data.threadId === thread.id && data.lastMessageId === latest.id;
    });
    if (alreadyNotified) continue;

    const reminderDedupeKey = `pending-reminder:${recipientUserId}:${thread.id}:${latest.id}`;
    const recentReminderJob = await prisma.jobQueue.findFirst({
      where: {
        type: "send_email_notification",
        dedupeKey: reminderDedupeKey,
        createdAt: { gte: cooldownFloor },
        status: { in: ["queued", "failed", "running", "done"] },
      },
      select: { id: true },
    });
    if (recentReminderJob) continue;

    const title = "Tienes un mensaje pendiente";
    const body =
      recipientRole === "coach"
        ? `${senderName} sigue esperando tu respuesta en el chat.`
        : `${senderName} sigue esperando tu respuesta en la conversacion.`;

    await createUserNotification({
      userId: recipientUserId,
      type: "pending_message_reminder",
      title,
      body,
      data: {
        threadId: thread.id,
        lastMessageId: latest.id,
        senderType: latest.senderType,
        linkPath:
          recipientRole === "coach"
            ? `/mi-cuenta/coach/mensajes/${thread.id}`
            : `/mi-cuenta/cliente/mensajes/${thread.id}`,
        linkLabel: "Responder ahora",
      },
      email: {
        dedupeKey: reminderDedupeKey,
      },
    });
    remindersQueued += 1;
  }

  return {
    scannedThreads: threads.length,
    remindersQueued,
    thresholdMinutes: delayMinutes,
    cooldownMinutes,
  };
}
