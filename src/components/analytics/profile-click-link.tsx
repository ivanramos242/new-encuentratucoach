"use client";

import type { ClickTarget } from "@prisma/client";
import { getLastDirectoryPath, trackDirectoryFunnelEvent } from "@/lib/directory-funnel-client";

type TrackableTarget = Extract<
  ClickTarget,
  "whatsapp" | "phone" | "email" | "web" | "linkedin" | "instagram" | "facebook" | "mensaje"
>;

export function ProfileClickLink({
  coachId,
  target,
  href,
  children,
  className,
  external = false,
  sourcePath,
}: {
  coachId: string;
  target: TrackableTarget;
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
  sourcePath?: string;
}) {
  const onClick = () => {
    const funnelEvent = target === "whatsapp" ? "click_whatsapp" : "click_contact";
    trackDirectoryFunnelEvent(funnelEvent, {
      coachProfileId: coachId,
      sourcePath: sourcePath || getLastDirectoryPath() || window.location.pathname,
      sourceModule: "coach_profile",
      metadata: { target },
    });

    const payload = JSON.stringify({ coachId, target });
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/profile-click", blob);
        return;
      }
    } catch {
      // fallback below
    }
    void fetch("/api/analytics/profile-click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  };

  return (
    <a
      href={href}
      onClick={onClick}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      className={className}
    >
      {children}
    </a>
  );
}
