import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

const contactSchema = z.object({
  coachId: z.string().min(1),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  message: z.string().min(10).max(5000),
  honeypot: z.string().optional().default(""),
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeEmailList(input?: string | null) {
  if (!input) return [];
  return input
    .split(/[;,]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Datos inválidos", 400, { issues: parsed.error.flatten() });
    }

    if (parsed.data.honeypot.trim()) {
      return jsonOk({ message: "OK" });
    }

    const coach = await prisma.coachProfile.findUnique({
      where: { id: parsed.data.coachId },
      select: {
        id: true,
        name: true,
        slug: true,
        links: {
          select: { type: true, value: true },
        },
      },
    });

    if (!coach) {
      return jsonError("Coach no encontrado.", 404);
    }

    const coachEmail = coach.links.find((link) => link.type === "email")?.value?.trim();
    const recipients = Array.from(
      new Set([
        coachEmail,
        ...normalizeEmailList(process.env.CONTACT_TO),
        ...normalizeEmailList(process.env.ALERTS_TO),
      ].filter(Boolean)),
    ) as string[];

    if (recipients.length === 0) {
      return jsonError("No hay correo de destino configurado para este formulario.", 500);
    }

    const lead = await prisma.coachContactLead.create({
      data: {
        coachProfileId: coach.id,
        name: parsed.data.name.trim(),
        email: parsed.data.email.trim(),
        message: parsed.data.message.trim(),
        status: "received",
      },
      select: { id: true },
    });

    const safeCoachName = escapeHtml(coach.name);
    const safeSenderName = escapeHtml(parsed.data.name.trim());
    const safeSenderEmail = escapeHtml(parsed.data.email.trim());
    const safeMessage = escapeHtml(parsed.data.message.trim()).replace(/\n/g, "<br />");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://encuentratucoach.es";
    const profileUrl = `${siteUrl.replace(/\/$/, "")}/coaches/${coach.slug}`;

    const subject = `Nuevo mensaje para ${coach.name} · EncuentraTuCoach`;
    const text = [
      `Has recibido un nuevo mensaje para el perfil de ${coach.name}.`,
      "",
      `Nombre: ${parsed.data.name.trim()}`,
      `Email: ${parsed.data.email.trim()}`,
      "",
      "Mensaje:",
      parsed.data.message.trim(),
      "",
      `Perfil: ${profileUrl}`,
    ].join("\n");

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <h2 style="margin:0 0 12px;font-size:20px">Nuevo mensaje para ${safeCoachName}</h2>
        <p style="margin:0 0 10px">Has recibido un nuevo contacto desde EncuentraTuCoach.</p>
        <table style="border-collapse:collapse;width:100%;max-width:680px;margin:12px 0">
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">Nombre</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${safeSenderName}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">Email</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${safeSenderEmail}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">Perfil</td>
            <td style="padding:8px;border:1px solid #e5e7eb"><a href="${profileUrl}">${profileUrl}</a></td>
          </tr>
        </table>
        <div style="margin-top:12px;padding:12px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff">
          <div style="font-weight:600;margin-bottom:6px">Mensaje</div>
          <div>${safeMessage}</div>
        </div>
      </div>
    `;

    const mailResult = await sendMail({
      to: recipients.join(", "),
      subject,
      text,
      html,
      replyTo: `${parsed.data.name.trim()} <${parsed.data.email.trim()}>`,
    });

    if (!mailResult.delivered) {
      await prisma.coachContactLead.update({
        where: { id: lead.id },
        data: {
          status: "failed",
          errorMessage: mailResult.reason,
        },
      });
      return jsonError("No se pudo enviar el correo en este momento. Inténtalo de nuevo.", 502);
    }

    await prisma.coachContactLead.update({
      where: { id: lead.id },
      data: {
        status: "emailed",
        errorMessage: null,
      },
    });

    return jsonOk({
      message: "Mensaje enviado correctamente.",
      coachId: parsed.data.coachId,
    });
  } catch (error) {
    console.error("[contact/coach] POST failed", error);
    return jsonError("No se pudo procesar la solicitud", 400);
  }
}

