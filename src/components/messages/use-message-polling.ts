"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MessageItemDto, MessageServerHints } from "@/types/messages";

type PollResponse = {
  ok: boolean;
  items?: MessageItemDto[];
  nextCursor?: string | null;
  pollIntervalMs?: number;
  serverHints?: MessageServerHints;
  message?: string;
};

export function useMessagePolling({
  threadId,
  enabled,
  onItems,
  onServerHints,
}: {
  threadId: string;
  enabled: boolean;
  onItems: (items: MessageItemDto[]) => void;
  onServerHints?: (hints: MessageServerHints) => void;
}) {
  const [polling, setPolling] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastPollAt, setLastPollAt] = useState<number | null>(null);
  const cursorRef = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);
  const inFlightRef = useRef(false);
  const suggestedPollMsRef = useRef(15_000);
  const onItemsRef = useRef(onItems);
  const onServerHintsRef = useRef(onServerHints);
  const pollNowRef = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    onItemsRef.current = onItems;
    onServerHintsRef.current = onServerHints;
  }, [onItems, onServerHints]);

  useEffect(() => {
    cursorRef.current = null;
    suggestedPollMsRef.current = 15_000;
    setLastError(null);
  }, [threadId]);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const schedule = useCallback(
    (ms: number) => {
      clearTimer();
      if (stoppedRef.current || !enabled) return;
      const jitter = Math.round(ms * (Math.random() * 0.15));
      timeoutRef.current = window.setTimeout(() => {
        void pollNowRef.current();
      }, ms + jitter);
    },
    [clearTimer, enabled],
  );

  const pollNow = useCallback(async () => {
    if (!enabled || stoppedRef.current) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setPolling(true);
    try {
      const mode = document.visibilityState === "hidden" ? "background" : "foreground";
      const params = new URLSearchParams();
      if (cursorRef.current) params.set("cursor", cursorRef.current);
      params.set("mode", mode);
      const res = await fetch(`/api/messages/threads/${threadId}/poll?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await res.json()) as PollResponse;

      if (!res.ok || !payload.ok) {
        const retryAfterHeader = Number(res.headers.get("Retry-After") || 0);
        const retryMs =
          Number(payload.serverHints?.retryAfterMs) ||
          (Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader * 1000 : 15000);
        setLastError(payload.message || "No se pudo actualizar el chat.");
        if (payload.serverHints) {
          suggestedPollMsRef.current = payload.serverHints.suggestedPollMs;
          onServerHintsRef.current?.(payload.serverHints);
        }
        schedule(Math.max(retryMs, suggestedPollMsRef.current));
        return;
      }

      setLastError(null);
      setLastPollAt(Date.now());
      if (payload.nextCursor !== undefined) cursorRef.current = payload.nextCursor ?? null;
      if (payload.serverHints) {
        suggestedPollMsRef.current = payload.serverHints.suggestedPollMs;
        onServerHintsRef.current?.(payload.serverHints);
      } else if (typeof payload.pollIntervalMs === "number" && payload.pollIntervalMs > 0) {
        suggestedPollMsRef.current = payload.pollIntervalMs;
      }
      if (payload.items?.length) onItemsRef.current(payload.items);
      schedule(suggestedPollMsRef.current);
    } catch {
      setLastError("Error de red al actualizar mensajes.");
      schedule(Math.max(15000, suggestedPollMsRef.current));
    } finally {
      inFlightRef.current = false;
      setPolling(false);
    }
  }, [enabled, schedule, threadId]);

  pollNowRef.current = pollNow;

  useEffect(() => {
    stoppedRef.current = !enabled;
    if (!enabled) {
      clearTimer();
      return;
    }
    void pollNow();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void pollNow();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stoppedRef.current = true;
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimer();
    };
  }, [clearTimer, enabled, pollNow]);

  return {
    pollNow,
    polling,
    lastError,
    lastPollAt,
    setCursor(cursor: string | null) {
      cursorRef.current = cursor;
    },
  };
}
