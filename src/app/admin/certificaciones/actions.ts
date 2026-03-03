"use server";

import type { CertificationRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

function parseDecision(value: FormDataEntryValue | null): CertificationRequestStatus | null {
  if (value === "approved" || value === "rejected") return value;
  return null;
}

function normalizeReviewerNote(value: FormDataEntryValue | null, decision: CertificationRequestStatus) {
  const note = typeof value === "string" ? value.trim() : "";
  if (note) return note.slice(0, 1500);
  if (decision === "approved") return "Aprobacion masiva desde panel admin.";
  return "Denegacion masiva desde panel admin.";
}

export async function reviewAllPendingCertificationRequestsAction(formData: FormData) {
  const adminUser = await requireRole("admin", { returnTo: "/admin/certificaciones" });

  const decision = parseDecision(formData.get("decision"));
  if (!decision) redirect("/admin/certificaciones?error=invalid-decision");

  const reviewerNote = normalizeReviewerNote(formData.get("note"), decision);
  const reviewedAt = new Date();

  const reviewedCount = await prisma.$transaction(async (tx) => {
    const pendingRows = await tx.certificationRequest.findMany({
      where: { status: "pending" },
      select: { id: true, coachProfileId: true },
    });

    if (!pendingRows.length) return 0;

    const reviewedRows: { id: string; coachProfileId: string }[] = [];
    for (const row of pendingRows) {
      const updated = await tx.certificationRequest.updateMany({
        where: { id: row.id, status: "pending" },
        data: {
          status: decision,
          reviewerUserId: adminUser.id,
          reviewerNotes: reviewerNote,
          reviewedAt,
        },
      });
      if (updated.count > 0) reviewedRows.push(row);
    }

    if (!reviewedRows.length) return 0;

    const profileIds = Array.from(new Set(reviewedRows.map((item) => item.coachProfileId)));
    await tx.coachProfile.updateMany({
      where: { id: { in: profileIds } },
      data: { certifiedStatus: decision },
    });

    await tx.certificationReviewLog.createMany({
      data: reviewedRows.map((item) => ({
        certificationRequestId: item.id,
        reviewerUserId: adminUser.id,
        decision,
        note: reviewerNote,
      })),
    });

    return reviewedRows.length;
  });

  if (reviewedCount === 0) {
    redirect("/admin/certificaciones?info=no-pending&count=0");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/certificaciones");
  revalidatePath("/coaches");
  revalidatePath("/coaches/certificados");
  revalidatePath("/mi-cuenta/coach");
  revalidatePath("/mi-cuenta/coach/certificacion");

  const params = new URLSearchParams({
    bulk: decision,
    count: String(reviewedCount),
  });
  redirect(`/admin/certificaciones?${params.toString()}`);
}
