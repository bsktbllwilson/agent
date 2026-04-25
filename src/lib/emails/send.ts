import "server-only";
import { Resend } from "resend";

const FROM_DEFAULT = "Pass The Plate <noreply@passtheplate.store>";

// Lazily construct Resend so a missing/invalid RESEND_API_KEY doesn't blow up
// at module-load time during the Next.js build (page-data collection).
let cached: Resend | null | undefined;
function getResend(): Resend | null {
  if (cached !== undefined) return cached;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    cached = null;
    return null;
  }
  try {
    // Strip non-ASCII characters defensively — Headers() requires ByteString.
    const safe = apiKey.replace(/[^\x20-\x7E]/g, "").trim();
    cached = new Resend(safe);
  } catch (err) {
    console.error("[email] Resend init failed:", err);
    cached = null;
  }
  return cached;
}

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — skipping send:", payload.subject);
    return;
  }
  const from = process.env.EMAIL_FROM ?? FROM_DEFAULT;
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
