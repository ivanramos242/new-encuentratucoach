import { requireSessionUser } from "@/lib/auth-server";
import { getUnreadMessagesTotalForUser } from "@/lib/conversation-service";
import { AccountShell } from "@/components/account/account-shell";
import { getCoachProfileForEditor } from "@/lib/coach-profile-service";
import { prisma } from "@/lib/prisma";

function isActiveish(status?: string | null) {
  return status === "active" || status === "trialing";
}

function membershipStateFromStatus(status?: string | null) {
  if (isActiveish(status)) return { label: "Activa", tone: "success" as const };
  if (status === "incomplete") return { label: "Pendiente", tone: "warning" as const };
  if (status === "past_due" || status === "unpaid") return { label: "Pago fallido", tone: "danger" as const };
  if (status === "canceled" || status === "incomplete_expired") return { label: "Cancelada", tone: "neutral" as const };
  return { label: "Sin plan", tone: "neutral" as const };
}

function certificationStateFromValues(
  certifiedStatus?: string | null,
  requestStatus?: string | null,
) {
  if (certifiedStatus === "approved" || requestStatus === "approved") return { label: "Aprobada", tone: "success" as const };
  if (certifiedStatus === "pending" || requestStatus === "pending") return { label: "En revision", tone: "warning" as const };
  if (certifiedStatus === "rejected" || requestStatus === "rejected") return { label: "Rechazada", tone: "danger" as const };
  return { label: "Sin solicitud", tone: "neutral" as const };
}

export default async function MyAccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser({ returnTo: "/mi-cuenta" });
  const unreadMessagesCount = await getUnreadMessagesTotalForUser(user);
  let sectionStates: Record<string, { label: string; tone: "neutral" | "success" | "warning" | "danger" }> = {};

  if (user.role === "coach") {
    const profile = await getCoachProfileForEditor(user);
    const checks = [
      Boolean(profile?.name?.trim()),
      Boolean(profile?.bio?.trim() || (profile as { aboutHtml?: string | null } | null)?.aboutHtml?.trim()),
      Boolean(profile?.pricing?.basePriceEur),
      Boolean(profile?.location?.city?.trim()),
      Boolean((profile?.sessionModes?.length || 0) > 0),
    ];
    const completed = checks.filter(Boolean).length;
    const total = checks.length;
    const profileStatus =
      completed === total && profile?.profileStatus === "published"
        ? { label: "Publicado", tone: "success" as const }
        : completed > 0
          ? { label: `${completed}/${total}`, tone: "warning" as const }
          : { label: "Pendiente", tone: "neutral" as const };

    const membershipStatus = membershipStateFromStatus(profile?.subscriptions?.[0]?.status);

    const latestCertificationRequest = profile
      ? await prisma.certificationRequest.findFirst({
          where: { coachProfileId: profile.id },
          orderBy: { submittedAt: "desc" },
          select: { status: true },
        })
      : null;

    const certificationStatus = certificationStateFromValues(
      profile?.certifiedStatus,
      latestCertificationRequest?.status,
    );

    sectionStates = {
      "/mi-cuenta/coach/perfil": profileStatus,
      "/mi-cuenta/coach/membresia": membershipStatus,
      "/mi-cuenta/coach/certificacion": certificationStatus,
      "/mi-cuenta/coach/mensajes":
        unreadMessagesCount > 0 ? { label: "Pendientes", tone: "warning" } : { label: "Al dia", tone: "success" },
    };
  }

  if (user.role === "client") {
    sectionStates = {
      "/mi-cuenta/cliente/mensajes":
        unreadMessagesCount > 0 ? { label: "Pendientes", tone: "warning" } : { label: "Al dia", tone: "success" },
      "/mi-cuenta/cliente/notificaciones": { label: "Activo", tone: "neutral" },
    };
  }

  return (
    <AccountShell
      role={user.role}
      displayName={user.displayName}
      email={user.email}
      unreadMessagesCount={unreadMessagesCount}
      sectionStates={sectionStates}
    >
      {children}
    </AccountShell>
  );
}
