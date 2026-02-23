"use client";

import { useEffect, useRef } from "react";

export function ProfileAnalyticsTracker({ coachId }: { coachId: string }) {
  const sessionId = useRef<string | null>(null);
  const startedAt = useRef<number>(0);

  useEffect(() => {
    const id = crypto.randomUUID();
    sessionId.current = id;
    startedAt.current = Date.now();

    void fetch("/api/analytics/profile-view/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ coachId, sessionId: id, startedAt: new Date().toISOString() }),
    }).catch(() => undefined);

    const endTracking = () => {
      if (!sessionId.current) return;
      const payload = JSON.stringify({
        coachId,
        sessionId: sessionId.current,
        durationSeconds: Math.round((Date.now() - startedAt.current) / 1000),
        endedAt: new Date().toISOString(),
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/profile-view/end", payload);
      } else {
        void fetch("/api/analytics/profile-view/end", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => undefined);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") endTracking();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", endTracking);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", endTracking);
      endTracking();
    };
  }, [coachId]);

  return null;
}
