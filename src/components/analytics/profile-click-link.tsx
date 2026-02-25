"use client";

import type { ClickTarget } from "@prisma/client";

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
}: {
  coachId: string;
  target: TrackableTarget;
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}) {
  const onClick = () => {
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

