import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Pass The Plate <noreply@passtheplate.store>";

const resend = apiKey ? new Resend(apiKey) : null;

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — skipping send:", payload.subject);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      replyTo: payload.replyTo,
    });
    if (error) console.error("[email] send failed:", error);
  } catch (err) {
    console.error("[email] exception:", err);
  }
}

export function adminEmail(): string | null {
  return process.env.ADMIN_EMAIL ?? null;
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://passtheplate.store";
}
