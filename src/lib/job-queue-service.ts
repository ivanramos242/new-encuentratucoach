import { randomUUID } from "node:crypto";
import type { JobPriority, JobStatus, JobType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";

type JsonObject = Record<string, unknown>;

type EmailJobPayload = {
  kind: "email";
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  notificationId?: string;
  metadata?: JsonObject;
};

const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000];

function now() {
  return new Date();
}

function hostLabel() {
  const host = process.env.HOSTNAME?.trim();
  return host || "web";
}

function toJsonObject(value: Prisma.JsonValue | null | undefined): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonObject;
}

function parseEmailJobPayload(payload: Prisma.JsonValue | null | undefined): EmailJobPayload | null {
  const raw = toJsonObject(payload);
  if (raw.kind !== "email") return null;
  if (typeof raw.to !== "string" || typeof raw.subject !== "string" || typeof raw.html !== "string") return null;
  return {
    kind: "email",
    to: raw.to,
    subject: raw.subject,
    html: raw.html,
    text: typeof raw.text === "string" ? raw.text : undefined,
    replyTo: typeof raw.replyTo === "string" ? raw.replyTo : undefined,
    notificationId: typeof raw.notificationId === "string" ? raw.notificationId : undefined,
    metadata: toJsonObject(raw.metadata as Prisma.JsonValue | null | undefined),
  };
}

export async function enqueueJob(input: {
  type: JobType;
  payload?: JsonObject;
  priority?: JobPriority;
  scheduledAt?: Date;
  maxAttempts?: number;
  dedupeKey?: string;
}) {
  const scheduledAt = input.scheduledAt ?? now();
  if (input.dedupeKey?.trim()) {
    const dedupeWindowSeconds = Number(process.env.NOTIFICATION_EMAIL_DEDUPE_WINDOW_SECONDS ?? 300);
    const dedupeFloor =
      Number.isFinite(dedupeWindowSeconds) && dedupeWindowSeconds > 0
        ? new Date(Date.now() - dedupeWindowSeconds * 1000)
        : null;
    const existing = await prisma.jobQueue.findFirst({
      where: {
        type: input.type,
        dedupeKey: input.dedupeKey.trim(),
        status: { in: ["queued", "failed", "running", "done"] },
        ...(dedupeFloor ? { createdAt: { gte: dedupeFloor } } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing) return existing;
  }

  return prisma.jobQueue.create({
    data: {
      type: input.type,
      status: "queued",
      priority: input.priority ?? "normal",
      payload: (input.payload ?? {}) as Prisma.InputJsonValue,
      dedupeKey: input.dedupeKey?.trim() || null,
      scheduledAt,
      maxAttempts: input.maxAttempts ?? 5,
    },
  });
}

export async function enqueueEmailJob(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  notificationId?: string;
  metadata?: JsonObject;
  priority?: JobPriority;
  scheduledAt?: Date;
  dedupeKey?: string;
}) {
  return enqueueJob({
    type: "send_email_notification",
    priority: input.priority ?? "normal",
    scheduledAt: input.scheduledAt,
    dedupeKey: input.dedupeKey,
    payload: {
      kind: "email",
      to: input.to,
      subject: input.subject,
      html: input.html,
      ...(input.text ? { text: input.text } : {}),
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
      ...(input.notificationId ? { notificationId: input.notificationId } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
    },
  });
}

type JobResult = {
  note?: string;
};

async function processEmailJob(job: {
  id: string;
  payload: Prisma.JsonValue | null;
}): Promise<JobResult> {
  const parsed = parseEmailJobPayload(job.payload);
  if (!parsed) throw new Error("Invalid email job payload");

  let notificationContext: { notificationId: string; userId: string | null } | null = null;
  let deliveryAttemptId: string | null = null;

  if (parsed.notificationId) {
    const notification = await prisma.notification.findUnique({
      where: { id: parsed.notificationId },
      select: { id: true, userId: true },
    });
    if (notification) {
      notificationContext = { notificationId: notification.id, userId: notification.userId };
      const attempt = await prisma.notificationDeliveryAttempt.create({
        data: {
          notificationId: notification.id,
          userId: notification.userId,
          channel: "email",
          status: "pending",
          provider: "smtp",
          attemptedAt: now(),
        },
        select: { id: true },
      });
      deliveryAttemptId = attempt.id;
    }
  }

  const delivery = await sendMail({
    to: parsed.to,
    subject: parsed.subject,
    html: parsed.html,
    text: parsed.text,
    replyTo: parsed.replyTo,
  });

  if (delivery.delivered) {
    if (deliveryAttemptId) {
      await prisma.notificationDeliveryAttempt.update({
        where: { id: deliveryAttemptId },
        data: {
          status: "sent",
          attemptedAt: now(),
          providerMessageId: delivery.messageId,
        },
      });
    }
    return { note: `Email sent to ${parsed.to}` };
  }

  if (delivery.reason === "smtp_not_configured") {
    if (deliveryAttemptId) {
      await prisma.notificationDeliveryAttempt.update({
        where: { id: deliveryAttemptId },
        data: {
          status: "skipped",
          attemptedAt: now(),
          errorMessage: "SMTP not configured",
        },
      });
    }
    return { note: "SMTP not configured. Email skipped." };
  }

  if (deliveryAttemptId) {
    await prisma.notificationDeliveryAttempt.update({
      where: { id: deliveryAttemptId },
      data: {
        status: "failed",
        attemptedAt: now(),
        errorMessage: "SMTP send failed",
      },
    });
  } else if (notificationContext) {
    await prisma.notificationDeliveryAttempt.create({
      data: {
        notificationId: notificationContext.notificationId,
        userId: notificationContext.userId,
        channel: "email",
        status: "failed",
        provider: "smtp",
        attemptedAt: now(),
        errorMessage: "SMTP send failed",
      },
    });
  }

  throw new Error("SMTP send failed");
}

async function processJob(job: { id: string; type: JobType; payload: Prisma.JsonValue | null }): Promise<JobResult> {
  if (job.type === "send_email_notification" || job.type === "retry_email_notification") {
    return processEmailJob(job);
  }
  return { note: `No handler for job type ${job.type}. Marked as done.` };
}

async function createRunLog(input: {
  jobId: string;
  actorUserId?: string | null;
  status: JobStatus;
  note?: string;
  errorMessage?: string;
  durationMs?: number;
}) {
  await prisma.jobRunLog.create({
    data: {
      jobId: input.jobId,
      actorUserId: input.actorUserId ?? null,
      status: input.status,
      note: input.note ?? null,
      errorMessage: input.errorMessage ?? null,
      durationMs: input.durationMs ?? null,
    },
  });
}

function retryDelayMs(attempts: number) {
  return RETRY_DELAYS_MS[Math.min(Math.max(attempts - 1, 0), RETRY_DELAYS_MS.length - 1)];
}

export async function runDueJobs(options?: { batchSize?: number; timeoutMs?: number; actorUserId?: string | null }) {
  const batchSize = options?.batchSize ?? Number(process.env.JOB_RUN_BATCH_SIZE ?? 25);
  const timeoutMs = options?.timeoutMs ?? Number(process.env.JOB_RUN_TIMEOUT_MS ?? 10_000);
  const startedAtMs = Date.now();

  const due = await prisma.jobQueue.findMany({
    where: {
      status: { in: ["queued", "failed"] },
      scheduledAt: { lte: now() },
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    take: batchSize,
  });

  let processed = 0;
  for (const candidate of due) {
    if (Date.now() - startedAtMs > timeoutMs) break;

    const lock = await prisma.jobQueue.updateMany({
      where: { id: candidate.id, status: { in: ["queued", "failed"] } },
      data: {
        status: "running",
        attempts: { increment: 1 },
        startedAt: now(),
        lockedAt: now(),
        lockedBy: hostLabel(),
      },
    });
    if (!lock.count) continue;

    const startedAt = Date.now();
    const attempt = candidate.attempts + 1;

    try {
      const result = await processJob({
        id: candidate.id,
        type: candidate.type,
        payload: candidate.payload,
      });

      await prisma.jobQueue.update({
        where: { id: candidate.id },
        data: {
          status: "done",
          finishedAt: now(),
          lastError: null,
          lockedAt: null,
          lockedBy: null,
        },
      });
      await createRunLog({
        jobId: candidate.id,
        actorUserId: options?.actorUserId,
        status: "done",
        note: result.note,
        durationMs: Date.now() - startedAt,
      });
      processed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const willDeadLetter = attempt >= candidate.maxAttempts;

      await prisma.jobQueue.update({
        where: { id: candidate.id },
        data: {
          status: willDeadLetter ? "dead_letter" : "failed",
          scheduledAt: willDeadLetter ? candidate.scheduledAt : new Date(Date.now() + retryDelayMs(attempt)),
          lastError: message,
          finishedAt: now(),
          lockedAt: null,
          lockedBy: null,
        },
      });
      await createRunLog({
        jobId: candidate.id,
        actorUserId: options?.actorUserId,
        status: willDeadLetter ? "dead_letter" : "failed",
        errorMessage: message,
        durationMs: Date.now() - startedAt,
      });
    }
  }

  const remainingQueued = await prisma.jobQueue.count({
    where: { status: { in: ["queued", "failed"] } },
  });

  return {
    processed,
    scanned: due.length,
    remainingQueued,
    tookMs: Date.now() - startedAtMs,
  };
}

export async function getJobsSnapshot(input?: { limit?: number }) {
  const limit = input?.limit ?? 100;
  return prisma.jobQueue.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });
}

export async function getJobRunLogs(input?: { limit?: number }) {
  const limit = input?.limit ?? 100;
  return prisma.jobRunLog.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });
}

export async function retryJob(jobId: string, actorUserId?: string | null) {
  const existing = await prisma.jobQueue.findUnique({ where: { id: jobId } });
  if (!existing) return { error: "Job no encontrado." as const };

  const job = await prisma.jobQueue.update({
    where: { id: jobId },
    data: {
      status: "queued",
      scheduledAt: now(),
      finishedAt: null,
      startedAt: null,
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    },
  });

  await createRunLog({
    jobId,
    actorUserId: actorUserId ?? null,
    status: "queued",
    note: "Job requeued manually",
  });

  return { job };
}

export async function cancelJob(jobId: string, actorUserId?: string | null) {
  const existing = await prisma.jobQueue.findUnique({ where: { id: jobId } });
  if (!existing) return { error: "Job no encontrado." as const };

  const job = await prisma.jobQueue.update({
    where: { id: jobId },
    data: {
      status: "dead_letter",
      finishedAt: now(),
      lockedAt: null,
      lockedBy: null,
      lastError: "Canceled manually",
    },
  });

  await createRunLog({
    jobId,
    actorUserId: actorUserId ?? null,
    status: "dead_letter",
    note: "Job canceled manually",
  });

  return { job };
}

export function buildAdminJobDedupeKey(scope: string) {
  return `admin:${scope}:${randomUUID()}`;
}
