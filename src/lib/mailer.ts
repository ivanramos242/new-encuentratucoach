import nodemailer from "nodemailer";

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

export async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (!hasSmtpConfig()) {
    console.warn("[mailer] SMTP no configurado; email no enviado", {
      to: input.to,
      subject: input.subject,
    });
    return { delivered: false as const, reason: "smtp_not_configured" as const };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || "EncuentraTuCoach <no-reply@example.com>",
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  return { delivered: true as const, messageId: info.messageId };
}

