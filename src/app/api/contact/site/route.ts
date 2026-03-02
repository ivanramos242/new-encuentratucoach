import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { sendMail } from "@/lib/mailer";
import { applyEndpointRateLimit } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().max(120).optional().default(""),
  email: z.string().trim().email().max(320),
  reason: z.enum(["soporte", "cuenta", "membresia", "certificacion", "colaboracion"]),
  relatedUrl: z.string().trim().max(500).optional().default(""),
  message: z.string().trim().min(10).max(5000),
  privacyAccepted: z.coerce.boolean().refine((value) => value, "Debes aceptar la política de privacidad."),
  honeypot: z.string().optional().default(""),
});

const reasonLabels: Record<z.infer<typeof contactSchema>["reason"], string> = {
  soporte: "Soporte técnico",
  cuenta: "Cuenta y acceso",
  membresia: "Membresía",
  certificacion: "Certificación",
  colaboracion: "Colaboración",
};

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

function looksLikeSpam(message: string) {
  const text = message.toLowerCase();
  const urlMatches = text.match(/https?:\/\//g) ?? [];
  const suspiciousWords = ["crypto", "casino", "forex", "seo", "backlink", "viagra", "loan"];
  const suspiciousHits = suspiciousWords.filter((word) => text.includes(word)).length;
  return urlMatches.length >= 3 || suspiciousHits >= 2;
}

function isSafeRelatedUrl(input: string) {
  if (!input) return true;
  try {
    const parsed = new URL(input);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const rateLimited = applyEndpointRateLimit(request, {
      namespace: "contact-site",
      limit: 8,
      windowMs: 10 * 60_000,
      message: "Demasiados envíos en poco tiempo. Inténtalo más tarde.",
    });
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Datos inválidos.", 400, { issues: parsed.error.flatten() });
    }

    if (parsed.data.honeypot.trim()) {
      return jsonOk({ message: "Formulario enviado correctamente." });
    }

    if (looksLikeSpam(parsed.data.message)) {
      return jsonError("No se pudo procesar la solicitud.", 429, { code: "SPAM_DETECTED" });
    }

    if (!isSafeRelatedUrl(parsed.data.relatedUrl)) {
      return jsonError("La URL relacionada no es válida.", 400);
    }

    const recipients = Array.from(
      new Set([
        ...normalizeEmailList(process.env.CONTACT_TO),
        ...normalizeEmailList(process.env.ALERTS_TO),
        "info@encuentratucoach.es",
      ]),
    );

    if (!recipients.length) {
      return jsonError("No hay correo de destino configurado para el formulario.", 500);
    }

    const senderName = parsed.data.name.trim() || "Sin nombre";
    const senderEmail = parsed.data.email.trim();
    const reasonLabel = reasonLabels[parsed.data.reason];
    const relatedUrl = parsed.data.relatedUrl.trim();
    const safeMessage = escapeHtml(parsed.data.message.trim()).replace(/\n/g, "<br />");

    const subject = `Nuevo formulario de contacto · ${reasonLabel}`;
    const text = [
      "Has recibido un nuevo formulario de contacto desde EncuentraTuCoach.",
      "",
      `Motivo: ${reasonLabel}`,
      `Nombre: ${senderName}`,
      `Email: ${senderEmail}`,
      `URL relacionada: ${relatedUrl || "No indicada"}`,
      "",
      "Mensaje:",
      parsed.data.message.trim(),
    ].join("\n");

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <h2 style="margin:0 0 12px;font-size:20px">Nuevo formulario de contacto</h2>
        <p style="margin:0 0 10px">Has recibido un nuevo mensaje desde la página de contacto.</p>
        <table style="border-collapse:collapse;width:100%;max-width:680px;margin:12px 0">
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">Motivo</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(reasonLabel)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">Nombre</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(senderName)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">Email</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(senderEmail)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">URL relacionada</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${relatedUrl ? `<a href="${escapeHtml(relatedUrl)}">${escapeHtml(relatedUrl)}</a>` : "No indicada"}</td>
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
      replyTo: parsed.data.name.trim() ? `${parsed.data.name.trim()} <${senderEmail}>` : senderEmail,
    });

    if (!mailResult.delivered) {
      return jsonError("No se pudo enviar el correo en este momento. Inténtalo de nuevo.", 502);
    }

    return jsonOk({
      message: "Formulario enviado correctamente. Te responderemos lo antes posible.",
    });
  } catch (error) {
    console.error("[contact/site] POST failed", error);
    return jsonError("No se pudo procesar la solicitud.", 400);
  }
}
