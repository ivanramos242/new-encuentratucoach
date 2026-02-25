import type { MessageServerHints, QueuePressure } from "@/types/messages";

type BucketState = {
  ticks: number[];
};

declare global {
  // eslint-disable-next-line no-var
  var __messageRateBuckets: Map<string, BucketState> | undefined;
}

const buckets = global.__messageRateBuckets ?? new Map<string, BucketState>();
if (!global.__messageRateBuckets) global.__messageRateBuckets = buckets;

function now() {
  return Date.now();
}

function getBucket(key: string) {
  const bucket = buckets.get(key) ?? { ticks: [] };
  buckets.set(key, bucket);
  return bucket;
}

function trim(bucket: BucketState, windowMs: number, at: number) {
  const cutoff = at - windowMs;
  while (bucket.ticks.length && bucket.ticks[0] < cutoff) {
    bucket.ticks.shift();
  }
}

function countInWindow(key: string, windowMs: number, at = now()) {
  const bucket = getBucket(key);
  trim(bucket, windowMs, at);
  return bucket.ticks.length;
}

function mark(key: string, at = now()) {
  const bucket = getBucket(key);
  bucket.ticks.push(at);
}

function pressureFromRate(rateScore: number): QueuePressure {
  if (rateScore >= 1) return "high";
  if (rateScore >= 0.55) return "medium";
  return "low";
}

function hintsFromPressure(pressure: QueuePressure, retryAfterMs?: number): MessageServerHints {
  const suggestedPollMs =
    pressure === "high" ? 30_000 : pressure === "medium" ? 22_000 : 15_000;
  return {
    queuePressure: pressure,
    suggestedPollMs,
    ...(retryAfterMs && retryAfterMs > 0 ? { retryAfterMs } : {}),
  };
}

export function checkSendAllowance(input: { userId: string; threadId: string }) {
  const at = now();
  const userKey = `send:user:${input.userId}`;
  const threadKey = `send:thread:${input.threadId}`;

  const userCount10s = countInWindow(userKey, 10_000, at);
  const threadCount5s = countInWindow(threadKey, 5_000, at);
  const globalCount5s = countInWindow("send:global", 5_000, at);

  const pressureScore = Math.max(userCount10s / 15, threadCount5s / 8, globalCount5s / 100);
  const pressure = pressureFromRate(pressureScore);

  let retryAfterMs = 0;
  if (userCount10s >= 15) retryAfterMs = Math.max(retryAfterMs, 800);
  if (threadCount5s >= 8) retryAfterMs = Math.max(retryAfterMs, 1200);
  if (globalCount5s >= 120) retryAfterMs = Math.max(retryAfterMs, 2000);

  if (retryAfterMs > 0) {
    return {
      allowed: false as const,
      retryAfterMs,
      serverHints: hintsFromPressure(pressure, retryAfterMs),
    };
  }

  mark(userKey, at);
  mark(threadKey, at);
  mark("send:global", at);

  return {
    allowed: true as const,
    serverHints: hintsFromPressure(pressure),
  };
}

export function checkPollAllowance(input: { userId: string; threadId?: string; mode?: "foreground" | "background" | "inbox" }) {
  const at = now();
  const mode = input.mode ?? "foreground";
  const userKey = `poll:user:${input.userId}:${mode}`;
  const targetKey = input.threadId ? `poll:thread:${input.threadId}:${mode}` : `poll:inbox:${input.userId}`;

  const userCount10s = countInWindow(userKey, 10_000, at);
  const targetCount10s = countInWindow(targetKey, 10_000, at);
  const globalCount10s = countInWindow("poll:global", 10_000, at);

  const modeLimits =
    mode === "background" ? { user: 8, target: 8 } : mode === "inbox" ? { user: 10, target: 10 } : { user: 20, target: 25 };

  const pressureScore = Math.max(userCount10s / modeLimits.user, targetCount10s / modeLimits.target, globalCount10s / 250);
  const pressure = pressureFromRate(pressureScore);

  let retryAfterMs = 0;
  if (userCount10s >= modeLimits.user) retryAfterMs = Math.max(retryAfterMs, mode === "background" ? 5000 : 1500);
  if (targetCount10s >= modeLimits.target) retryAfterMs = Math.max(retryAfterMs, mode === "background" ? 5000 : 1200);
  if (globalCount10s >= 320) retryAfterMs = Math.max(retryAfterMs, 2000);

  if (retryAfterMs > 0) {
    return {
      allowed: false as const,
      retryAfterMs,
      serverHints: hintsFromPressure(pressure, retryAfterMs),
    };
  }

  mark(userKey, at);
  mark(targetKey, at);
  mark("poll:global", at);

  const base = hintsFromPressure(pressure);
  const suggestedPollMs =
    mode === "background"
      ? Math.max(base.suggestedPollMs, 30_000)
      : mode === "inbox"
        ? Math.max(base.suggestedPollMs, 20_000)
        : base.suggestedPollMs;

  return {
    allowed: true as const,
    serverHints: { ...base, suggestedPollMs },
  };
}
