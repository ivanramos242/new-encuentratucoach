import { coaches } from "@/lib/mock-data";
import {
  buildMockAttachmentPresignResponse,
  findCoachBySlug,
  getFunnelSummaryForCoach,
  getJobsSnapshot as getJobsSnapshotFromMock,
  getMessageThreadById,
  getMessageThreadsForActor,
  getNotificationPreferencesForUser,
  getNotificationsForUser,
  getQaQuestionBySlug,
  getQaQuestionsList,
  jobQueueRecords,
  messageThreads,
  notificationPreferences,
  notificationRecords,
  platformFunnelSummary,
  qaQuestions,
  qaTopics,
} from "@/lib/v2-mock";
import type { MockActor } from "@/lib/mock-auth-context";
import { slugify } from "@/lib/utils";
import type {
  FunnelEventType,
  FunnelSummary,
  JobPriority,
  JobRecord,
  MessageItem,
  MessageThread,
  NotificationPreferenceRecord,
  NotificationRecord,
  NotificationType,
  QaAnswer,
  QaQuestion,
  QaVoteType,
} from "@/types/v2";

type QaReportRecord = {
  id: string;
  targetType: "question" | "answer";
  targetId: string;
  reporterUserId: string;
  reason: string;
  details?: string;
  status: "open" | "resolved";
  createdAt: string;
};

type ConversationReportRecord = {
  id: string;
  threadId: string;
  messageId?: string;
  reporterUserId: string;
  reason: string;
  details?: string;
  status: "open" | "resolved";
  createdAt: string;
};

type JobRunLogRecord = {
  id: string;
  jobId: string;
  status: "done" | "failed" | "canceled";
  note?: string;
  errorMessage?: string;
  createdAt: string;
};

type FunnelEventRecord = {
  id: string;
  eventType: FunnelEventType;
  coachProfileId?: string;
  userId?: string;
  createdAt: string;
  sourcePath?: string;
  attribution?: Record<string, unknown>;
};

const qaVotes = new Map<string, QaVoteType>();
const qaReports: QaReportRecord[] = [];
const conversationReports: ConversationReportRecord[] = [];
const jobRunLogs: JobRunLogRecord[] = [];
const funnelEvents: FunnelEventRecord[] = [];

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureQuestion(questionIdOrSlug: string) {
  return qaQuestions.find((q) => q.id === questionIdOrSlug) ?? getQaQuestionBySlug(questionIdOrSlug);
}

function ensureActorCanViewThread(actor: MockActor, thread: MessageThread) {
  if (actor.role === "admin") return true;
  if (actor.role === "coach") return thread.coachUserId === actor.userId;
  if (actor.role === "client") return thread.clientUserId === actor.userId;
  return false;
}

function notify(userId: string, type: NotificationType, title: string, body: string, data?: Record<string, unknown>) {
  const notification: NotificationRecord = {
    id: uid("notif"),
    userId,
    type,
    title,
    body,
    isRead: false,
    createdAt: nowIso(),
    data,
  };
  notificationRecords.push(notification);
  queueJob({
    type: "send_email_notification",
    priority: "normal",
    payload: { notificationId: notification.id, channel: "email" },
  });
  return notification;
}

export function queueJob(input: {
  type: JobRecord["type"];
  priority?: JobPriority;
  payload?: Record<string, unknown>;
  scheduledAt?: string;
}) {
  const job: JobRecord = {
    id: uid("job"),
    type: input.type,
    status: "queued",
    priority: input.priority ?? "normal",
    scheduledAt: input.scheduledAt ?? nowIso(),
    attempts: 0,
    maxAttempts: 5,
    payload: input.payload ?? {},
  };
  jobQueueRecords.push(job);
  return job;
}

export function listThreadsForActor(actor: MockActor) {
  if (actor.role === "coach") {
    return getMessageThreadsForActor("coach").filter((t) => t.coachUserId === actor.userId);
  }
  if (actor.role === "client") {
    return getMessageThreadsForActor("client").filter((t) => t.clientUserId === actor.userId);
  }
  return [...messageThreads].sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
}

export function startOrGetThread(input: {
  actor: MockActor;
  coachSlug?: string;
  coachProfileId?: string;
  source?: string;
}) {
  if (input.actor.role !== "client") {
    return { error: "Solo clientes autenticados pueden iniciar conversaciones." as const };
  }

  const coach =
    (input.coachProfileId ? coaches.find((c) => c.id === input.coachProfileId) : undefined) ??
    (input.coachSlug ? findCoachBySlug(input.coachSlug) : undefined);

  if (!coach) return { error: "Coach no encontrado." as const };
  if (!coach.visibilityActive) return { error: "El coach no tiene el perfil activo." as const };

  const existing = messageThreads.find(
    (thread) => thread.clientUserId === input.actor.userId && thread.coachProfileId === coach.id,
  );
  if (existing) return { thread: existing, created: false as const };

  const thread: MessageThread = {
    id: uid("thread"),
    clientUserId: input.actor.userId,
    clientName: input.actor.displayName,
    coachUserId: `user-${coach.id.replace("coach", "coach")}`,
    coachProfileId: coach.id,
    coachName: coach.name,
    coachSlug: coach.slug,
    coachMembershipActive: coach.visibilityActive,
    status: "open",
    unreadForCoach: 0,
    unreadForClient: 0,
    lastMessageAt: nowIso(),
    createdAt: nowIso(),
    messages: [],
  };

  messageThreads.unshift(thread);
  funnelEvents.push({
    id: uid("funnel"),
    eventType: "chat_thread_started",
    coachProfileId: coach.id,
    userId: input.actor.userId,
    createdAt: nowIso(),
    sourcePath: typeof input.source === "string" ? input.source : "/coaches/" + coach.slug,
  });
  notify(
    thread.coachUserId,
    "message_new",
    "Nueva conversación iniciada",
    `${thread.clientName} ha iniciado una conversación contigo.`,
    { threadId: thread.id, coachProfileId: thread.coachProfileId },
  );

  return { thread, created: true as const };
}

export function getThreadForActor(threadId: string, actor: MockActor) {
  const thread = getMessageThreadById(threadId);
  if (!thread) return { error: "Conversacion no encontrada." as const };
  if (!ensureActorCanViewThread(actor, thread)) return { error: "No tienes acceso a esta conversación." as const };
  return { thread };
}

export function addThreadMessage(input: {
  threadId: string;
  actor: MockActor;
  body?: string;
  attachment?: MessageItem["attachment"];
}) {
  const thread = getMessageThreadById(input.threadId);
  if (!thread) return { error: "Conversacion no encontrada." as const };
  if (!ensureActorCanViewThread(input.actor, thread)) return { error: "No tienes acceso a esta conversación." as const };

  const body = (input.body ?? "").trim();
  if (!body && !input.attachment) return { error: "Debes enviar texto o un adjunto." as const };
  if (body.length > 4000) return { error: "El mensaje supera el maximo de 4000 caracteres." as const };

  if (input.actor.role === "coach") {
    if (thread.coachUserId !== input.actor.userId) return { error: "Solo el coach del hilo puede responder." as const };
    if (!thread.coachMembershipActive) {
      return { error: "Tu membresía está inactiva. Puedes leer, pero no responder." as const };
    }
  }
  if (input.actor.role === "client" && thread.clientUserId !== input.actor.userId) {
    return { error: "Solo el cliente del hilo puede escribir." as const };
  }

  const senderType = input.actor.role === "coach" ? "coach" : input.actor.role === "client" ? "client" : "admin_system";
  const message: MessageItem = {
    id: uid("msg"),
    threadId: thread.id,
    senderType,
    senderUserId: input.actor.userId,
    senderLabel: input.actor.displayName,
    body,
    createdAt: nowIso(),
    readByOtherSide: false,
    attachment: input.attachment,
  };

  thread.messages.push(message);
  thread.lastMessageAt = message.createdAt;

  if (senderType === "coach") {
    thread.unreadForClient += 1;
    if (thread.messages.filter((m) => m.senderType === "coach").length === 1) {
      funnelEvents.push({
        id: uid("funnel"),
        eventType: "chat_first_coach_reply",
        coachProfileId: thread.coachProfileId,
        userId: input.actor.userId,
        createdAt: nowIso(),
      });
    }
    notify(thread.clientUserId, "message_reply", "Respuesta del coach", `${thread.coachName} ha respondido en tu inbox.`, {
      threadId: thread.id,
    });
  } else if (senderType === "client") {
    thread.unreadForCoach += 1;
    const clientMessages = thread.messages.filter((m) => m.senderType === "client").length;
    if (clientMessages > 1) {
      funnelEvents.push({
        id: uid("funnel"),
        eventType: "chat_client_followup",
        coachProfileId: thread.coachProfileId,
        userId: input.actor.userId,
        createdAt: nowIso(),
      });
    }
    notify(thread.coachUserId, "message_new", "Nuevo mensaje en tu inbox", `${thread.clientName} te ha escrito.`, {
      threadId: thread.id,
    });
  }

  return { thread, message };
}

export function markThreadRead(input: { threadId: string; actor: MockActor }) {
  const thread = getMessageThreadById(input.threadId);
  if (!thread) return { error: "Conversacion no encontrada." as const };
  if (!ensureActorCanViewThread(input.actor, thread)) return { error: "No tienes acceso a esta conversación." as const };

  if (input.actor.role === "coach") {
    thread.unreadForCoach = 0;
    thread.messages.forEach((m) => {
      if (m.senderType === "client") m.readByOtherSide = true;
    });
  } else if (input.actor.role === "client") {
    thread.unreadForClient = 0;
    thread.messages.forEach((m) => {
      if (m.senderType === "coach") m.readByOtherSide = true;
    });
  }

  return { threadId: thread.id, markedAt: nowIso() };
}

export function pollThreadMessages(input: { threadId: string; actor: MockActor; since?: string | null }) {
  const thread = getMessageThreadById(input.threadId);
  if (!thread) return { error: "Conversacion no encontrada." as const };
  if (!ensureActorCanViewThread(input.actor, thread)) return { error: "No tienes acceso a esta conversación." as const };

  const sinceMs = input.since ? +new Date(input.since) : 0;
  const items = thread.messages.filter((m) => +new Date(m.createdAt) > sinceMs);
  return { threadId: thread.id, items, serverTime: nowIso() };
}

export function createConversationReport(input: {
  actor: MockActor;
  threadId: string;
  messageId?: string;
  reason: string;
  details?: string;
}) {
  const thread = getMessageThreadById(input.threadId);
  if (!thread) return { error: "Conversacion no encontrada." as const };
  if (!ensureActorCanViewThread(input.actor, thread)) return { error: "No tienes acceso a esta conversación." as const };

  const report: ConversationReportRecord = {
    id: uid("conv-report"),
    threadId: input.threadId,
    messageId: input.messageId,
    reporterUserId: input.actor.userId,
    reason: input.reason,
    details: input.details,
    status: "open",
    createdAt: nowIso(),
  };
  conversationReports.unshift(report);

  notify(
    "user-admin-1",
    "message_thread_reported",
    "Nuevo reporte de mensajeria",
    "Se ha reportado un hilo o mensaje del inbox interno.",
    { reportId: report.id, threadId: report.threadId, messageId: report.messageId },
  );

  return { report };
}

export function listQaQuestions(input?: Parameters<typeof getQaQuestionsList>[0]) {
  return getQaQuestionsList(input);
}

export function getQaQuestionById(questionId: string) {
  return qaQuestions.find((q) => q.id === questionId);
}

export function createQaQuestion(input: {
  actor: MockActor;
  title: string;
  body: string;
  topicSlug: string;
  isAnonymous?: boolean;
  categorySlug?: string;
  citySlug?: string;
  tags?: string[];
}) {
  const topic = qaTopics.find((t) => t.slug === input.topicSlug);
  if (!topic) return { error: "Tema no valido." as const };

  const baseSlug = slugify(input.title).slice(0, 90) || "pregunta";
  let slug = baseSlug;
  let suffix = 2;
  while (qaQuestions.some((q) => q.slug === slug)) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const question: QaQuestion = {
    id: uid("q"),
    slug,
    title: input.title.trim(),
    body: input.body.trim(),
    authorUserId: input.actor.userId,
    authorDisplayName: input.actor.displayName,
    isAnonymous: Boolean(input.isAnonymous),
    status: "published",
    topicSlug: topic.slug,
    topicName: topic.name,
    categorySlug: input.categorySlug || undefined,
    citySlug: input.citySlug || undefined,
    tags: (input.tags ?? [])
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 6),
    answers: [],
    views: 0,
    votesTotal: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  qaQuestions.unshift(question);
  funnelEvents.push({
    id: uid("funnel"),
    eventType: "qa_question_created",
    userId: input.actor.userId,
    createdAt: nowIso(),
    sourcePath: "/pregunta-a-un-coach",
  });

  return { question };
}

export function addQaAnswer(input: { actor: MockActor; questionId: string; body: string; coachProfileId?: string }) {
  if (input.actor.role !== "coach" && input.actor.role !== "admin") {
    return { error: "Solo coaches activos pueden responder." as const };
  }
  const question = ensureQuestion(input.questionId);
  if (!question || question.status !== "published") return { error: "Pregunta no encontrada." as const };

  const coachProfileId = input.coachProfileId ?? input.actor.coachProfileId ?? "coach-1";
  const coach = coaches.find((c) => c.id === coachProfileId);
  if (!coach) return { error: "Coach no encontrado." as const };
  if (!coach.visibilityActive) return { error: "Solo coaches con perfil activo pueden responder." as const };

  const answer: QaAnswer = {
    id: uid("qa-ans"),
    questionId: question.id,
    coachProfileId: coach.id,
    coachName: coach.name,
    coachSlug: coach.slug,
    coachIsActive: coach.visibilityActive,
    body: input.body.trim(),
    status: "published",
    voteScore: 0,
    votesCount: 0,
    accepted: false,
    createdAt: nowIso(),
  };

  question.answers.unshift(answer);
  question.updatedAt = nowIso();

  funnelEvents.push({
    id: uid("funnel"),
    eventType: "qa_answer_created",
    coachProfileId: coach.id,
    userId: input.actor.userId,
    createdAt: nowIso(),
    sourcePath: `/pregunta-a-un-coach/${question.slug}`,
  });

  notify(
    question.authorUserId,
    "qa_question_answered",
    "Tu pregunta ha recibido una respuesta",
    `${coach.name} ha respondido a tu pregunta en Pregunta a un coach.`,
    { questionId: question.id, answerId: answer.id },
  );

  return { question, answer };
}

export function voteQaAnswer(input: { actor: MockActor; answerId: string; voteType: QaVoteType }) {
  const question = qaQuestions.find((q) => q.answers.some((a) => a.id === input.answerId));
  const answer = question?.answers.find((a) => a.id === input.answerId);
  if (!question || !answer) return { error: "Respuesta no encontrada." as const };

  const key = `${input.answerId}:${input.actor.userId}`;
  const previous = qaVotes.get(key);
  if (previous === input.voteType) {
    return { answer, changed: false as const };
  }

  if (previous === "up") {
    answer.voteScore -= 1;
    answer.votesCount = Math.max(0, answer.votesCount - 1);
    question.votesTotal = Math.max(0, question.votesTotal - 1);
  } else if (previous === "down") {
    answer.voteScore += 1;
    answer.votesCount = Math.max(0, answer.votesCount - 1);
  }

  if (input.voteType === "up") {
    answer.voteScore += 1;
    answer.votesCount += 1;
    question.votesTotal += 1;
  } else {
    answer.voteScore -= 1;
    answer.votesCount += 1;
  }

  qaVotes.set(key, input.voteType);
  question.updatedAt = nowIso();
  return { answer, changed: true as const, userVote: input.voteType };
}

export function acceptQaAnswer(input: { actor: MockActor; questionId: string; answerId: string }) {
  const question = getQaQuestionById(input.questionId);
  if (!question) return { error: "Pregunta no encontrada." as const };
  if (question.authorUserId !== input.actor.userId && input.actor.role !== "admin") {
    return { error: "Solo el autor de la pregunta puede aceptar una respuesta." as const };
  }

  const answer = question.answers.find((item) => item.id === input.answerId);
  if (!answer) return { error: "Respuesta no encontrada." as const };

  question.answers.forEach((item) => {
    item.accepted = item.id === input.answerId;
  });
  question.acceptedAnswerId = input.answerId;
  question.updatedAt = nowIso();

  funnelEvents.push({
    id: uid("funnel"),
    eventType: "qa_answer_accepted",
    coachProfileId: answer.coachProfileId,
    userId: input.actor.userId,
    createdAt: nowIso(),
  });

  notify(
    `user-${answer.coachProfileId.replace("coach", "coach")}`,
    "qa_answer_accepted",
    "Han aceptado tu respuesta",
    `Tu respuesta en Pregunta a un coach ha sido marcada como aceptada.`,
    { questionId: question.id, answerId: answer.id },
  );

  return { question, answer };
}

export function createQaReport(input: {
  actor: MockActor;
  targetType: "question" | "answer";
  targetId: string;
  reason: string;
  details?: string;
}) {
  const report: QaReportRecord = {
    id: uid("qa-report"),
    targetType: input.targetType,
    targetId: input.targetId,
    reporterUserId: input.actor.userId,
    reason: input.reason,
    details: input.details,
    status: "open",
    createdAt: nowIso(),
  };
  qaReports.unshift(report);
  notify("user-admin-1", "qa_content_reported", "Nuevo reporte de Q&A", "Se ha reportado contenido en Pregunta a un coach.", {
    reportId: report.id,
    targetType: report.targetType,
    targetId: report.targetId,
  });
  return { report };
}

export function listNotifications(actor: MockActor) {
  return getNotificationsForUser(actor.userId);
}

export function pollNotifications(actor: MockActor, since?: string | null) {
  const sinceMs = since ? +new Date(since) : 0;
  const items = getNotificationsForUser(actor.userId).filter((n) => +new Date(n.createdAt) > sinceMs);
  return { items, serverTime: nowIso() };
}

export function markNotificationRead(actor: MockActor, notificationId: string) {
  const item = notificationRecords.find((n) => n.id === notificationId && n.userId === actor.userId);
  if (!item) return { error: "Notificacion no encontrada." as const };
  item.isRead = true;
  return { notification: item };
}

export function readAllNotifications(actor: MockActor) {
  let affected = 0;
  notificationRecords.forEach((n) => {
    if (n.userId === actor.userId && !n.isRead) {
      n.isRead = true;
      affected += 1;
    }
  });
  return { affected };
}

export function listNotificationPreferences(actor: MockActor) {
  const existing = getNotificationPreferencesForUser(actor.userId);
  if (existing.length) return existing;

  const defaults: NotificationType[] = [
    "message_new",
    "message_reply",
    "qa_question_answered",
    "qa_answer_accepted",
    "review_new_pending",
    "review_coach_action_required",
    "subscription_state_changed",
    "system_announcement",
  ];

  const seeded = defaults.flatMap((type) => [
    {
      id: uid("pref"),
      userId: actor.userId,
      type,
      channel: "in_app" as const,
      enabled: true,
      digestMode: "instant" as const,
    },
    {
      id: uid("pref"),
      userId: actor.userId,
      type,
      channel: "email" as const,
      enabled: type === "system_announcement" ? false : true,
      digestMode: "instant" as const,
    },
  ]);
  notificationPreferences.push(...seeded);
  return seeded;
}

export function upsertNotificationPreferences(
  actor: MockActor,
  items: Array<Pick<NotificationPreferenceRecord, "type" | "channel" | "enabled">>,
) {
  const updated: NotificationPreferenceRecord[] = [];
  for (const item of items) {
    let pref = notificationPreferences.find(
      (p) => p.userId === actor.userId && p.type === item.type && p.channel === item.channel,
    );
    if (!pref) {
      pref = {
        id: uid("pref"),
        userId: actor.userId,
        type: item.type,
        channel: item.channel,
        enabled: item.enabled,
        digestMode: "instant",
      };
      notificationPreferences.push(pref);
    } else {
      pref.enabled = item.enabled;
    }
    updated.push(pref);
  }
  return updated;
}

export function getJobsSnapshot() {
  return getJobsSnapshotFromMock();
}

export function getJobRunLogs() {
  return [...jobRunLogs].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function runDueJobs(options?: { batchSize?: number; timeoutMs?: number }) {
  const batchSize = options?.batchSize ?? Number(process.env.JOB_RUN_BATCH_SIZE ?? 25);
  const timeoutMs = options?.timeoutMs ?? Number(process.env.JOB_RUN_TIMEOUT_MS ?? 10_000);
  const startedAt = Date.now();
  const due = jobQueueRecords
    .filter((job) => job.status === "queued" && +new Date(job.scheduledAt) <= Date.now())
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
    .slice(0, batchSize);

  let processed = 0;
  for (const job of due) {
    if (Date.now() - startedAt > timeoutMs) break;
    job.status = "running";
    job.attempts += 1;

    try {
      if (job.type === "retry_email_notification" && job.attempts < 2) {
        throw new Error("Simulated SMTP retry failure");
      }
      job.status = "done";
      processed += 1;
      jobRunLogs.unshift({
        id: uid("job-run"),
        jobId: job.id,
        status: "done",
        note: `Processed ${job.type}`,
        createdAt: nowIso(),
      });
    } catch (error) {
      job.lastError = error instanceof Error ? error.message : "Unknown job error";
      if (job.attempts >= job.maxAttempts) {
        job.status = "dead_letter";
      } else {
        job.status = "failed";
        const retryDelayMs = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000][Math.min(job.attempts - 1, 3)];
        job.scheduledAt = new Date(Date.now() + retryDelayMs).toISOString();
      }
      jobRunLogs.unshift({
        id: uid("job-run"),
        jobId: job.id,
        status: "failed",
        errorMessage: job.lastError,
        createdAt: nowIso(),
      });
    }
  }

  return {
    processed,
    scanned: due.length,
    remainingQueued: jobQueueRecords.filter((job) => job.status === "queued").length,
    tookMs: Date.now() - startedAt,
  };
}

export function retryJob(jobId: string) {
  const job = jobQueueRecords.find((item) => item.id === jobId);
  if (!job) return { error: "Job no encontrado." as const };
  job.status = "queued";
  job.scheduledAt = nowIso();
  job.lastError = undefined;
  return { job };
}

export function cancelJob(jobId: string) {
  const job = jobQueueRecords.find((item) => item.id === jobId);
  if (!job) return { error: "Job no encontrado." as const };
  job.status = "dead_letter";
  job.lastError = "Canceled manually";
  jobRunLogs.unshift({
    id: uid("job-run"),
    jobId: job.id,
    status: "canceled",
    note: "Canceled from admin",
    createdAt: nowIso(),
  });
  return { job };
}

export function recordFunnelEvent(input: {
  actor?: MockActor;
  coachProfileId?: string;
  eventType: FunnelEventType;
  sourcePath?: string;
  attribution?: Record<string, unknown>;
}) {
  const record: FunnelEventRecord = {
    id: uid("funnel"),
    eventType: input.eventType,
    coachProfileId: input.coachProfileId,
    userId: input.actor?.userId,
    createdAt: nowIso(),
    sourcePath: input.sourcePath,
    attribution: input.attribution,
  };
  funnelEvents.push(record);
  return record;
}

function cloneFunnelSummary(summary: FunnelSummary): FunnelSummary {
  return {
    coachProfileId: summary.coachProfileId,
    periodLabel: summary.periodLabel,
    counts: { ...summary.counts },
    conversionRates: { ...summary.conversionRates },
  };
}

export function getCoachFunnel(coachProfileId: string) {
  const base = cloneFunnelSummary(getFunnelSummaryForCoach(coachProfileId));
  const recentEvents = funnelEvents.filter((event) => event.coachProfileId === coachProfileId);
  for (const event of recentEvents) {
    base.counts[event.eventType] = (base.counts[event.eventType] ?? 0) + 1;
  }
  const profileViews = base.counts.profile_view || 0;
  const chatStarts = base.counts.chat_thread_started || 0;
  const firstReplies = base.counts.chat_first_coach_reply || 0;
  const qaQuestions = base.counts.qa_question_created || 0;
  const qaAnswers = base.counts.qa_answer_created || 0;
  base.conversionRates.profileToChatStart = profileViews ? chatStarts / profileViews : 0;
  base.conversionRates.chatStartToFirstReply = chatStarts ? firstReplies / chatStarts : 0;
  base.conversionRates.qaQuestionToAnswer = qaQuestions ? qaAnswers / qaQuestions : 0;
  return base;
}

export function getPlatformFunnel() {
  const base = cloneFunnelSummary(platformFunnelSummary);
  for (const event of funnelEvents) {
    base.counts[event.eventType] = (base.counts[event.eventType] ?? 0) + 1;
  }
  return base;
}

export function getQaReports() {
  return [...qaReports];
}

export function getConversationReports() {
  return [...conversationReports];
}

export function getThreadAttachmentPresign(input: { fileName: string; mimeType: string; threadId?: string }) {
  return buildMockAttachmentPresignResponse(input);
}

export function getQaPollSnapshot() {
  return {
    latestUpdatedAt: qaQuestions
      .map((item) => +new Date(item.updatedAt))
      .sort((a, b) => b - a)[0]
      ?.toString(),
    counts: {
      questions: qaQuestions.length,
      answers: qaQuestions.reduce((sum, q) => sum + q.answers.length, 0),
      reportsOpen: qaReports.filter((report) => report.status === "open").length,
    },
  };
}
