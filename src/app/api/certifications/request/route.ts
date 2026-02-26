import { z } from "zod";
import { jsonError, jsonOk, jsonServerError } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

const documentSchema = z.object({
  storageKey: z.string().min(1).max(500),
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  sizeBytes: z.number().int().positive().max(25 * 1024 * 1024),
});

const schema = z.object({
  coachNotes: z.string().trim().max(3000).optional().default(""),
  documents: z.array(documentSchema).min(1, "Debes subir al menos un archivo").max(10),
});

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole(request, ["coach", "admin"]);
    if (!auth.ok) return auth.response;

    if (!auth.user.coachProfileId) {
      return jsonError("No se ha encontrado un perfil de coach vinculado a tu usuario.", 400);
    }

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });
    }

    const profile = await prisma.coachProfile.findUnique({
      where: { id: auth.user.coachProfileId },
      select: {
        id: true,
        slug: true,
        name: true,
        certifiedStatus: true,
        location: { select: { city: true, province: true, country: true } },
        owner: { select: { id: true, email: true, displayName: true } },
        links: { select: { type: true, value: true } },
      },
    });

    if (!profile) return jsonError("Perfil de coach no encontrado.", 404);
    if (auth.user.role !== "admin" && profile.owner?.id !== auth.user.id) {
      return jsonError("No tienes permisos para solicitar certificación para este perfil.", 403);
    }

    const existingPending = await prisma.certificationRequest.findFirst({
      where: { coachProfileId: profile.id, status: "pending" },
      orderBy: { submittedAt: "desc" },
      select: { id: true, submittedAt: true },
    });
    if (existingPending) {
      return jsonError("Ya tienes una solicitud de certificación pendiente de revisión.", 409, {
        pendingRequestId: existingPending.id,
        submittedAt: existingPending.submittedAt.toISOString(),
      });
    }

    const coachNotes = parsed.data.coachNotes?.trim() || null;
    const documents = parsed.data.documents;

    const created = await prisma.$transaction(async (tx) => {
      const req = await tx.certificationRequest.create({
        data: {
          coachProfileId: profile.id,
          coachUserId: profile.owner?.id ?? auth.user.id,
          status: "pending",
          coachNotes,
          documents: {
            create: documents.map((doc) => ({
              storageKey: doc.storageKey,
              fileName: doc.fileName,
              mimeType: doc.mimeType,
              sizeBytes: doc.sizeBytes,
            })),
          },
        },
        include: { documents: true },
      });

      await tx.coachProfile.update({
        where: { id: profile.id },
        data: { certifiedStatus: "pending" },
      });

      return req;
    });

    const phone = profile.links.find((link) => link.type === "phone")?.value ?? "";
    const web = profile.links.find((link) => link.type === "web")?.value ?? "";
    const city = [profile.location?.city, profile.location?.province, profile.location?.country].filter(Boolean).join(", ");
    const coachName = profile.name?.trim() || profile.owner?.displayName || auth.user.displayName || "Coach";
    const profileUrl =
      profile.slug && (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL)
        ? `${(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "").replace(/\/+$/, "")}/coaches/${profile.slug}`
        : null;

    const docsHtml = created.documents
      .map(
        (doc) =>
          `<li><strong>${escapeHtml(doc.fileName)}</strong> (${escapeHtml(doc.mimeType)} · ${escapeHtml(formatBytes(doc.sizeBytes))})<br /><code>${escapeHtml(doc.storageKey)}</code></li>`,
      )
      .join("");
    const docsText = created.documents
      .map((doc) => `- ${doc.fileName} (${doc.mimeType}, ${formatBytes(doc.sizeBytes)}) [${doc.storageKey}]`)
      .join("\n");

    const subject = `Nueva solicitud de certificación · ${coachName}`;
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#18181b">
        <h2 style="margin:0 0 12px">Nueva solicitud de certificación de coach</h2>
        <p>Se ha enviado una nueva solicitud para revisión manual (plazo estimado 5-14 días).</p>
        <ul>
          <li><strong>Coach:</strong> ${escapeHtml(coachName)}</li>
          <li><strong>Email:</strong> ${escapeHtml(profile.owner?.email || auth.user.email)}</li>
          ${phone ? `<li><strong>Teléfono:</strong> ${escapeHtml(phone)}</li>` : ""}
          ${city ? `<li><strong>Ubicación:</strong> ${escapeHtml(city)}</li>` : ""}
          ${web ? `<li><strong>Web:</strong> ${escapeHtml(web)}</li>` : ""}
          <li><strong>Perfil ID:</strong> ${escapeHtml(profile.id)}</li>
          <li><strong>Request ID:</strong> ${escapeHtml(created.id)}</li>
          ${profileUrl ? `<li><strong>Perfil público:</strong> <a href="${escapeHtml(profileUrl)}">${escapeHtml(profileUrl)}</a></li>` : ""}
        </ul>
        <p><strong>Notas del coach:</strong></p>
        <p>${escapeHtml(coachNotes || "Sin notas adicionales.").replaceAll("\n", "<br />")}</p>
        <p><strong>Documentos subidos (${created.documents.length}):</strong></p>
        <ol>${docsHtml}</ol>
      </div>
    `;
    const text = [
      "Nueva solicitud de certificación de coach",
      "",
      "Plazo de revisión estimado: 5-14 días.",
      "",
      `Coach: ${coachName}`,
      `Email: ${profile.owner?.email || auth.user.email}`,
      phone ? `Teléfono: ${phone}` : null,
      city ? `Ubicación: ${city}` : null,
      web ? `Web: ${web}` : null,
      `Perfil ID: ${profile.id}`,
      `Request ID: ${created.id}`,
      profileUrl ? `Perfil público: ${profileUrl}` : null,
      "",
      "Notas del coach:",
      coachNotes || "Sin notas adicionales.",
      "",
      `Documentos (${created.documents.length}):`,
      docsText,
    ]
      .filter(Boolean)
      .join("\n");

    const mailResult = await sendMail({
      to: "info@encuentratucoach.es",
      subject,
      html,
      text,
      replyTo: profile.owner?.email || auth.user.email,
    });

    return jsonOk({
      requestId: created.id,
      status: created.status,
      submittedAt: created.submittedAt.toISOString(),
      documentsCount: created.documents.length,
      emailDelivered: mailResult.delivered,
      reviewEta: "5-14 días",
    });
  } catch (error) {
    console.error("[certifications/request] error", error);
    return jsonServerError("No se pudo registrar la solicitud de certificación", error);
  }
}
