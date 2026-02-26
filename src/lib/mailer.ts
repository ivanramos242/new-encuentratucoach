import nodemailer from "nodemailer";

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

function parseSmtpSecure() {
  const raw = (process.env.SMTP_SECURE || "").trim().toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return Number(process.env.SMTP_PORT ?? 587) === 465;
}

export async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}) {
  if (!hasSmtpConfig()) {
    console.warn("[mailer] SMTP no configurado; email no enviado", {
      to: input.to,
      subject: input.subject,
    });
    return { delivered: false as const, reason: "smtp_not_configured" as const };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: parseSmtpSecure(),
      auth: process.env.SMTP_USER
        ? {
          user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || "EncuentraTuCoach <no-reply@example.com>",
      to: input.to,
      replyTo: input.replyTo,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    return { delivered: true as const, messageId: info.messageId };
  } catch (error) {
    console.error("[mailer] Error enviando email", {
      to: input.to,
      subject: input.subject,
      error: error instanceof Error ? error.message : String(error),
    });
    return { delivered: false as const, reason: "smtp_send_failed" as const };
  }
}
