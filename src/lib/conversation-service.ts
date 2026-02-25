import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth-session";
import { buildPublicObjectUrl } from "@/lib/s3-storage";
import type {
  MessageAttachmentDto,
  MessageItemDto,
  MessagePollResult,
  MessageServerHints,
  MessageThreadDetailDto,
  MessageThreadListResult,
  MessageThreadSummaryDto,
  MessagingRole,
} from "@/types/messages";

type ServiceErrorCode =
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMIT"
  | "UNSUPPORTED";

export type ServiceError = {
  error: string;
  code: ServiceErrorCode;
  retryAfterMs?: number;
  serverHints?: MessageServerHints;
};

type ThreadWithRelations = Prisma.ConversationThreadGetPayload<{
  include: {
    clientUser: { select: { id: true; displayName: true; email: true } };
    coachUser: { select: { id: true; displayName: true; email: true } };
    coachProfile: { select: { id: true; name: true; slug: true; visibilityStatus: true; messagingEnabled: true } };
    readCursors: true;
  };
}>;

type ThreadWithMessages = Prisma.ConversationThreadGetPayload<{
  include: {
    clientUser: { select: { id: true; displayName: true; email: true } };
    coachUser: { select: { id: true; displayName: true; email: true } };
    coachProfile: { select: { id: true; name: true; slug: true; visibilityStatus: true; messagingEnabled: true } };
    readCursors: true;
    messages: {
      where: { deletedAt: null };
      orderBy: [{ createdAt: "asc" }, { id: "asc" }];
      include: { senderUser: { select: { id: true; displayName: true; email: true } }; attachment: true };
    };
  };
}>;

type MessageWithRelations = Prisma.ConversationMessageGetPayload<{
  include: { senderUser: { select: { id: true; displayName: true; email: true } }; attachment: true };
}>;

function nowIso() {
  return new Date().toISOString();
}

function actorDisplayName(user: SessionUser) {
  return user.displayName?.trim() || user.email;
}

function inferMessagingRoleForThread(user: SessionUser, thread: { clientUserId: string; coachUserId: string }): MessagingRole | null {
  if (user.role === "admin") return null;
  if (thread.clientUserId === user.id) return "client";
  if (thread.coachUserId === user.id) return "coach";
  return null;
}

function hasThreadAccess(user: SessionUser, thread: { clientUserId: string; coachUserId: string }) {
  if (user.role === "admin") return true;
  return inferMessagingRoleForThread(user, thread) !== null;
}

function getOtherRole(role: MessagingRole) {
  return role === "coach" ? "client" : "coach";
}

function getPublicMessageBucket() {
  return process.env.S3_BUCKET_PUBLIC || "etc-public";
}

function attachmentDto(raw: NonNullable<MessageWithRelations["attachment"]>): MessageAttachmentDto {
  const mockUrl =
    raw.storageKey.startsWith("mock-message/")
      ? `/api/messages/attachments/mock-upload?key=${encodeURIComponent(raw.storageKey)}&download=1`
      : null;
  return {
    id: raw.id,
    type: raw.type as MessageAttachmentDto["type"],
    status: raw.status as MessageAttachmentDto["status"],
    fileName: raw.fileName,
    mimeType: raw.mimeType,
    sizeBytes: raw.sizeBytes,
    storageKey: raw.storageKey,
    downloadUrl: mockUrl || buildPublicObjectUrl(getPublicMessageBucket(), raw.storageKey),
    durationMs: (raw as { durationMs?: number | null }).durationMs ?? null,
  };
}

function resolveSenderLabel(message: MessageWithRelations, thread: ThreadWithRelations | ThreadWithMessages) {
  if (message.senderUser?.displayName?.trim()) return message.senderUser.displayName.trim();
  if (message.senderType === "coach") return thread.coachProfile.name || thread.coachUser.email;
  if (message.senderType === "client") return thread.clientUser.displayName || thread.clientUser.email;
  return "Sistema";
}

function isReadByOtherSide(message: MessageWithRelations, thread: ThreadWithRelations | ThreadWithMessages) {
  if (message.senderType === "admin_system") return true;
  const otherUserId = message.senderType === "coach" ? thread.clientUserId : thread.coachUserId;
  const cursor = thread.readCursors.find((c) => c.userId === otherUserId);
  if (!cursor?.lastReadAt) return false;
  return cursor.lastReadAt.getTime() >= message.createdAt.getTime();
}

function messageDto(message: MessageWithRelations, thread: ThreadWithRelations | ThreadWithMessages): MessageItemDto {
  return {
    id: message.id,
    threadId: message.threadId,
    senderType: message.senderType as MessageItemDto["senderType"],
    senderUserId: message.senderUserId ?? null,
    senderLabel: resolveSenderLabel(message, thread),
    body: message.body ?? "",
    createdAt: message.createdAt.toISOString(),
    readByOtherSide: isReadByOtherSide(message, thread),
    attachment: message.attachment ? attachmentDto(message.attachment) : undefined,
    clientRequestId: (message as { clientRequestId?: string | null }).clientRequestId ?? null,
  };
}

function previewFromMessage(message?: Pick<MessageItemDto, "body" | "attachment">) {
  if (!message) return "ConversaciÃ³n iniciada. EnvÃ­a tu primer mensaje.";
  if (message.body?.trim()) return message.body.trim();
  if (message.attachment) {
    if (message.attachment.type === "audio") return "Nota de audio";
    if (message.attachment.type === "image") return `Imagen: ${message.attachment.fileName}`;
    if (message.attachment.type === "pdf") return `PDF: ${message.attachment.fileName}`;
    return `Archivo: ${message.attachment.fileName}`;
  }
  return "Mensaje";
}

async function computeUnreadCounts(threadId: string, readCursors: ThreadWithRelations["readCursors"]) {
  const cursorByUser = new Map(readCursors.map((c) => [c.userId, c]));

  const [thread] = await prisma.conversationThread.findMany({
    where: { id: threadId },
    take: 1,
    select: { clientUserId: true, coachUserId: true },
  });
  if (!thread) return { unreadForCoach: 0, unreadForClient: 0 };

  const coachLastReadAt = cursorByUser.get(thread.coachUserId)?.lastReadAt;
  const clientLastReadAt = cursorByUser.get(thread.clientUserId)?.lastReadAt;

  const [unreadForCoach, unreadForClient] = await Promise.all([
    prisma.conversationMessage.count({
      where: {
        threadId,
        deletedAt: null,
        senderType: "client",
        ...(coachLastReadAt ? { createdAt: { gt: coachLastReadAt } } : {}),
      },
    }),
    prisma.conversationMessage.count({
      where: {
        threadId,
        deletedAt: null,
        senderType: "coach",
        ...(clientLastReadAt ? { createdAt: { gt: clientLastReadAt } } : {}),
      },
    }),
  ]);
  return { unreadForCoach, unreadForClient };
}

async function threadSummaryDto(
  thread: ThreadWithRelations,
  user: SessionUser,
  latestMessage?: MessageWithRelations,
): Promise<MessageThreadSummaryDto> {
  const [unread, messagesCount, latest] = await Promise.all([
    computeUnreadCounts(thread.id, thread.readCursors),
    prisma.conversationMessage.count({ where: { threadId: thread.id, deletedAt: null } }),
    latestMessage
      ? Promise.resolve(latestMessage)
      : prisma.conversationMessage.findFirst({
          where: { threadId: thread.id, deletedAt: null },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          include: { senderUser: { select: { id: true, displayName: true, email: true } }, attachment: true },
        }),
  ]);

  const latestDto = latest ? messageDto(latest, thread) : undefined;
  const viewerRole = inferMessagingRoleForThread(user, thread) ?? "coach";
  return {
    id: thread.id,
    viewerRole,
    clientUserId: thread.clientUserId,
    clientName: thread.clientUser.displayName || thread.clientUser.email,
    coachUserId: thread.coachUserId,
    coachProfileId: thread.coachProfileId,
    coachName: thread.coachProfile.name,
    coachSlug: thread.coachProfile.slug,
    coachMembershipActive: thread.coachProfile.visibilityStatus === "active" && thread.coachProfile.messagingEnabled,
    status: thread.status as MessageThreadSummaryDto["status"],
    unreadForCoach: unread.unreadForCoach,
    unreadForClient: unread.unreadForClient,
    lastMessageAt: (thread.lastMessageAt ?? thread.updatedAt ?? thread.createdAt).toISOString(),
    createdAt: thread.createdAt.toISOString(),
    messagesCount,
    lastMessagePreview: previewFromMessage(latestDto),
  };
}

async function loadThreadForUser(
  threadId: string,
  user: SessionUser,
): Promise<{ thread: ThreadWithMessages } | ServiceError> {
  const thread = await prisma.conversationThread.findUnique({
    where: { id: threadId },
    include: {
      clientUser: { select: { id: true, displayName: true, email: true } },
      coachUser: { select: { id: true, displayName: true, email: true } },
      coachProfile: { select: { id: true, name: true, slug: true, visibilityStatus: true, messagingEnabled: true } },
      readCursors: true,
      messages: {
        where: { deletedAt: null },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: { senderUser: { select: { id: true, displayName: true, email: true } }, attachment: true },
      },
    },
  });
  if (!thread) return { error: "ConversaciÃ³n no encontrada.", code: "NOT_FOUND" as const };
  if (!hasThreadAccess(user, thread)) return { error: "No tienes acceso a esta conversaciÃ³n.", code: "FORBIDDEN" as const };
  return { thread };
}

function canReply(user: SessionUser, thread: ThreadWithRelations | ThreadWithMessages) {
  if (thread.status !== "open") return false;
  const threadRole = inferMessagingRoleForThread(user, thread);
  if (!threadRole) return false;
  if (threadRole === "coach") {
    return thread.coachProfile.visibilityStatus === "active" && thread.coachProfile.messagingEnabled;
  }
  return true;
}

function encodeCursor(input: { createdAt: Date; id: string }) {
  return Buffer.from(JSON.stringify({ t: input.createdAt.toISOString(), id: input.id }), "utf8").toString("base64url");
}

function decodeCursor(cursor?: string | null): { createdAt: Date; id: string } | null {
  if (!cursor) return null;
  try {
    const raw = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as { t?: string; id?: string };
    if (!raw.t || !raw.id) return null;
    const d = new Date(raw.t);
    if (Number.isNaN(d.getTime())) return null;
    return { createdAt: d, id: raw.id };
  } catch {
    return null;
  }
}

async function upsertParticipantsAndCursors(thread: { id: string; clientUserId: string; coachUserId: string }) {
  await prisma.$transaction([
    prisma.conversationParticipant.upsert({
      where: { threadId_userId: { threadId: thread.id, userId: thread.clientUserId } },
      create: { threadId: thread.id, userId: thread.clientUserId, role: "client" },
      update: { isActive: true },
    }),
    prisma.conversationParticipant.upsert({
      where: { threadId_userId: { threadId: thread.id, userId: thread.coachUserId } },
      create: { threadId: thread.id, userId: thread.coachUserId, role: "coach" },
      update: { isActive: true },
    }),
    prisma.conversationReadCursor.upsert({
      where: { threadId_userId: { threadId: thread.id, userId: thread.clientUserId } },
      create: { threadId: thread.id, userId: thread.clientUserId },
      update: {},
    }),
    prisma.conversationReadCursor.upsert({
      where: { threadId_userId: { threadId: thread.id, userId: thread.coachUserId } },
      create: { threadId: thread.id, userId: thread.coachUserId },
      update: {},
    }),
  ]);
}

export async function listThreadsForUser(user: SessionUser): Promise<MessageThreadListResult | ServiceError> {
  if (user.role !== "client" && user.role !== "coach") {
    return { error: "Solo clientes y coaches pueden usar la mensajerÃ­a.", code: "FORBIDDEN" };
  }

  const where =
    user.role === "client"
      ? ({ clientUserId: user.id } satisfies Prisma.ConversationThreadWhereInput)
      : ({
          OR: [{ coachUserId: user.id }, { clientUserId: user.id }],
        } satisfies Prisma.ConversationThreadWhereInput);

  const threads = await prisma.conversationThread.findMany({
    where,
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    include: {
      clientUser: { select: { id: true, displayName: true, email: true } },
      coachUser: { select: { id: true, displayName: true, email: true } },
      coachProfile: { select: { id: true, name: true, slug: true, visibilityStatus: true, messagingEnabled: true } },
      readCursors: true,
    },
  });

  const latestMessages = await prisma.conversationMessage.findMany({
    where: {
      threadId: { in: threads.map((t) => t.id) },
      deletedAt: null,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: { senderUser: { select: { id: true, displayName: true, email: true } }, attachment: true },
  });
  const latestByThread = new Map<string, MessageWithRelations>();
  for (const msg of latestMessages) {
    if (!latestByThread.has(msg.threadId)) latestByThread.set(msg.threadId, msg);
  }

  const summaries = await Promise.all(threads.map((thread) => threadSummaryDto(thread, user, latestByThread.get(thread.id))));

  return {
    threads: summaries,
    serverHints: { queuePressure: "low", suggestedPollMs: Number(process.env.MESSAGE_POLL_INTERVAL_MS ?? 300_000) },
  };
}

export async function getThreadForUser(threadId: string, user: SessionUser): Promise<{ thread: MessageThreadDetailDto } | ServiceError> {
  const loaded = await loadThreadForUser(threadId, user);
  if (!("thread" in loaded)) return loaded;
  const thread = loaded.thread;
  const summary = await threadSummaryDto(thread, user);
  return {
    thread: {
      ...summary,
      messages: thread.messages.map((m) => messageDto(m, thread)),
    },
  };
}

export async function startOrGetThread(input: {
  user: SessionUser;
  coachSlug?: string;
  coachProfileId?: string;
  source?: string;
}): Promise<{ thread: MessageThreadDetailDto; created: boolean } | ServiceError> {
  if (input.user.role !== "client" && input.user.role !== "coach") {
    return { error: "Solo clientes y coaches autenticados pueden iniciar conversaciones.", code: "FORBIDDEN" };
  }
  if (!input.coachSlug && !input.coachProfileId) {
    return { error: "Debes indicar un coach para iniciar la conversaciÃ³n.", code: "VALIDATION" };
  }

  const coachProfile = await prisma.coachProfile.findFirst({
    where: {
      ...(input.coachProfileId ? { id: input.coachProfileId } : {}),
      ...(input.coachSlug ? { slug: input.coachSlug } : {}),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      userId: true,
      visibilityStatus: true,
      messagingEnabled: true,
    },
  });
  if (!coachProfile) return { error: "Coach no encontrado.", code: "NOT_FOUND" };
  if (coachProfile.visibilityStatus !== "active") {
    return { error: "El coach no tiene el perfil activo.", code: "FORBIDDEN" };
  }
  if (!coachProfile.messagingEnabled) {
    return { error: "El coach no tiene la mensajerÃ­a activa.", code: "FORBIDDEN" };
  }
  if (!coachProfile.userId) {
    return { error: "El coach aÃºn no tiene usuario vinculado para recibir mensajes.", code: "CONFLICT" };
  }
  const coachUserId = coachProfile.userId;
  if (coachUserId === input.user.id) {
    return { error: "No puedes iniciar un chat contigo mismo.", code: "FORBIDDEN" };
  }

  let created = false;
  const thread = await prisma.$transaction(async (tx) => {
    const existing = await tx.conversationThread.findUnique({
      where: { clientUserId_coachProfileId: { clientUserId: input.user.id, coachProfileId: coachProfile.id } },
    });
    if (existing) return existing;
    created = true;
    return tx.conversationThread.create({
      data: {
        clientUserId: input.user.id,
        coachUserId,
        coachProfileId: coachProfile.id,
        status: "open",
      },
    });
  });

  await upsertParticipantsAndCursors(thread);
  const result = await getThreadForUser(thread.id, input.user);
  if (!("thread" in result)) return result;
  return { thread: result.thread, created };
}

export async function sendMessage(input: {
  threadId: string;
  user: SessionUser;
  body?: string;
  attachment?: {
    id: string;
    type: "image" | "pdf" | "audio";
    status?: "uploaded" | "validated" | "rejected" | "deleted";
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    durationMs?: number | null;
  };
  clientRequestId?: string;
}): Promise<
  | {
      thread: MessageThreadDetailDto;
      message: MessageItemDto;
      deduped: boolean;
    }
  | ServiceError
> {
  const loaded = await loadThreadForUser(input.threadId, input.user);
  if (!("thread" in loaded)) return loaded;
  const thread = loaded.thread;

  if (!canReply(input.user, thread)) {
    return { error: "No puedes responder en este hilo.", code: "FORBIDDEN" };
  }

  const body = (input.body ?? "").trim();
  if (!body && !input.attachment) {
    return { error: "Debes enviar texto o un adjunto.", code: "VALIDATION" };
  }
  if (body.length > 4000) {
    return { error: "El mensaje supera el mÃ¡ximo de 4000 caracteres.", code: "VALIDATION" };
  }

  const senderType = inferMessagingRoleForThread(input.user, thread);
  if (!senderType) {
    return { error: "No tienes acceso a esta conversacion.", code: "FORBIDDEN" };
  }

  if (input.clientRequestId?.trim()) {
    try {
      const existing = await (prisma.conversationMessage.findFirst as unknown as (args: unknown) => Promise<MessageWithRelations | null>)({
        where: {
          threadId: input.threadId,
          senderUserId: input.user.id,
          clientRequestId: input.clientRequestId.trim(),
        },
        include: { senderUser: { select: { id: true, displayName: true, email: true } }, attachment: true },
      });
      if (existing) {
        const latest = await getThreadForUser(input.threadId, input.user);
        if (!("thread" in latest)) return latest;
        return {
          thread: latest.thread,
          message: messageDto(existing, thread),
          deduped: true,
        };
      }
    } catch {
      // Pre-migration compatibility: DB/schema may not yet have clientRequestId.
    }
  }

  let createdMessage: MessageWithRelations;
  try {
    createdMessage = await prisma.$transaction(async (tx) => {
      const message = await (tx.conversationMessage.create as unknown as (args: unknown) => Promise<MessageWithRelations>)({
        data: {
          threadId: input.threadId,
          senderUserId: input.user.id,
          senderType,
          body: body || null,
          ...(input.clientRequestId?.trim() ? { clientRequestId: input.clientRequestId.trim() } : {}),
          ...(input.attachment
            ? {
                attachment: {
                  create: {
                    threadId: input.threadId,
                    type: input.attachment.type,
                    status: input.attachment.status ?? "validated",
                    fileName: input.attachment.fileName,
                    mimeType: input.attachment.mimeType,
                    sizeBytes: input.attachment.sizeBytes,
                    storageKey: input.attachment.storageKey,
                    ...(typeof input.attachment.durationMs === "number" ? { durationMs: input.attachment.durationMs } : {}),
                  },
                },
              }
            : {}),
        },
        include: { senderUser: { select: { id: true, displayName: true, email: true } }, attachment: true },
      });

      await tx.conversationThread.update({
        where: { id: input.threadId },
        data: { lastMessageAt: message.createdAt, updatedAt: message.createdAt },
      });

      await tx.conversationReadCursor.upsert({
        where: { threadId_userId: { threadId: input.threadId, userId: input.user.id } },
        create: {
          threadId: input.threadId,
          userId: input.user.id,
          lastReadMessageId: message.id,
          lastReadAt: message.createdAt,
        },
        update: { lastReadMessageId: message.id, lastReadAt: message.createdAt },
      });

      return message;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar el mensaje";
    if (/clientRequestId/i.test(message) || /durationMs/i.test(message) || /enum/i.test(message)) {
      return {
        error:
          "La base de datos de mensajerÃ­a necesita migraciÃ³n para soportar deduplicaciÃ³n/audio. Ejecuta las migraciones de Prisma.",
        code: "UNSUPPORTED",
      };
    }
    throw error;
  }

  const latest = await getThreadForUser(input.threadId, input.user);
  if (!("thread" in latest)) return latest;
  return {
    thread: latest.thread,
    message: messageDto(createdMessage, {
      ...thread,
      messages: thread.messages,
    } as ThreadWithMessages),
    deduped: false,
  };
}

export async function markThreadRead(input: {
  threadId: string;
  user: SessionUser;
  lastReadMessageId?: string | null;
}): Promise<{ threadId: string; markedAt: string } | ServiceError> {
  const loaded = await loadThreadForUser(input.threadId, input.user);
  if (!("thread" in loaded)) return loaded;
  const thread = loaded.thread;

  const role = inferMessagingRoleForThread(input.user, thread);
  if (!role && input.user.role !== "admin") {
    return { error: "No tienes acceso a esta conversaciÃ³n.", code: "FORBIDDEN" };
  }

  const targetMessage =
    (input.lastReadMessageId
      ? thread.messages.find((m) => m.id === input.lastReadMessageId)
      : undefined) ?? thread.messages.at(-1);

  await prisma.conversationReadCursor.upsert({
    where: { threadId_userId: { threadId: input.threadId, userId: input.user.id } },
    create: {
      threadId: input.threadId,
      userId: input.user.id,
      lastReadMessageId: targetMessage?.id ?? null,
      lastReadAt: targetMessage?.createdAt ?? new Date(),
    },
    update: {
      lastReadMessageId: targetMessage?.id ?? null,
      lastReadAt: targetMessage?.createdAt ?? new Date(),
    },
  });

  void role;
  return { threadId: input.threadId, markedAt: nowIso() };
}

export async function pollThreadMessages(input: {
  threadId: string;
  user: SessionUser;
  cursor?: string | null;
}): Promise<MessagePollResult | ServiceError> {
  const loaded = await loadThreadForUser(input.threadId, input.user);
  if (!("thread" in loaded)) return loaded;
  const thread = loaded.thread;
  const parsedCursor = decodeCursor(input.cursor);

  const where: Prisma.ConversationMessageWhereInput = {
    threadId: input.threadId,
    deletedAt: null,
    ...(parsedCursor
      ? {
          OR: [
            { createdAt: { gt: parsedCursor.createdAt } },
            {
              AND: [{ createdAt: parsedCursor.createdAt }, { id: { gt: parsedCursor.id } }],
            },
          ],
        }
      : {}),
  };

  const items = await prisma.conversationMessage.findMany({
    where,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 50,
    include: { senderUser: { select: { id: true, displayName: true, email: true } }, attachment: true },
  });

  const mapped = items.map((m) => messageDto(m, thread));
  const lastMessage = items.at(-1);
  const nextCursor = lastMessage ? encodeCursor({ createdAt: lastMessage.createdAt, id: lastMessage.id }) : input.cursor ?? null;

  return {
    threadId: input.threadId,
    items: mapped,
    nextCursor,
    serverTime: nowIso(),
  };
}

export async function closeThreadForUser(input: {
  threadId: string;
  user: SessionUser;
}): Promise<{ threadId: string; status: "closed_by_client" | "closed_by_coach"; closedAt: string } | ServiceError> {
  const loaded = await loadThreadForUser(input.threadId, input.user);
  if (!("thread" in loaded)) return loaded;
  const thread = loaded.thread;

  const threadRole = inferMessagingRoleForThread(input.user, thread);
  if (!threadRole) return { error: "Accion no permitida.", code: "FORBIDDEN" };

  const status = threadRole === "coach" ? "closed_by_coach" : "closed_by_client";
  await prisma.conversationThread.update({
    where: { id: input.threadId },
    data: { status },
  });
  return { threadId: input.threadId, status, closedAt: nowIso() };
}
