import "server-only";
import { siteUrl } from "./send";

function shell(heading: string, body: string, cta?: { label: string; href: string }) {
  const base = siteUrl();
  const ctaBlock = cta
    ? `
      <tr>
        <td style="padding-top:24px">
          <a href="${cta.href}" style="display:inline-block;background:rgb(230,78,33);color:rgb(248,243,222);font-weight:500;padding:14px 28px;border-radius:999px;text-decoration:none;font-family:system-ui,-apple-system,sans-serif;font-size:15px;">${escape(cta.label)}</a>
        </td>
      </tr>`
    : "";
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:rgb(248,243,222);font-family:system-ui,-apple-system,sans-serif;color:#000;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgb(248,243,222);padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:20px;padding:40px;">
            <tr>
              <td>
                <div style="font-family:Georgia,serif;font-size:24px;letter-spacing:-0.01em;">
                  Pass <em>The</em> Plate
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-top:28px">
                <h1 style="margin:0;font-family:Georgia,serif;font-size:32px;line-height:1.15;font-weight:normal;letter-spacing:-0.02em;">${escape(heading)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding-top:16px;font-size:16px;line-height:1.55;color:#000;">${body}</td>
            </tr>${ctaBlock}
            <tr>
              <td style="padding-top:32px;border-top:1px solid rgba(0,0,0,0.1);margin-top:32px;"></td>
            </tr>
            <tr>
              <td style="padding-top:16px;font-size:12px;color:rgba(0,0,0,0.5);">
                <a href="${base}" style="color:rgba(0,0,0,0.5);text-decoration:none;">${escape(base.replace(/^https?:\/\//, ""))}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function listingSubmittedEmail(args: {
  listingName: string;
  listingId: string;
}) {
  const href = `${siteUrl()}/admin/listings?status=pending`;
  return {
    subject: `New listing awaiting review: ${args.listingName}`,
    html: shell(
      "New listing ready for review",
      `<p><strong>${escape(args.listingName)}</strong> was just submitted for review. Take a look when you have a moment.</p>`,
      { label: "Open queue", href },
    ),
  };
}

export function listingApprovedEmail(args: {
  listingName: string;
  slug: string;
}) {
  const href = `${siteUrl()}/listings/${encodeURIComponent(args.slug)}`;
  return {
    subject: `You're live: ${args.listingName}`,
    html: shell(
      "Your listing is live",
      `<p>Good news — <strong>${escape(args.listingName)}</strong> has been approved and is now visible on the marketplace.</p><p>We'll introduce interested buyers as inquiries come in.</p>`,
      { label: "View your listing", href },
    ),
  };
}

export function listingRejectedEmail(args: {
  listingName: string;
  editId: string;
  reason: string;
}) {
  const href = `${siteUrl()}/sell/listings/${encodeURIComponent(args.editId)}`;
  return {
    subject: `Feedback on your listing: ${args.listingName}`,
    html: shell(
      "We sent you feedback",
      `<p>Thanks for submitting <strong>${escape(args.listingName)}</strong>. Our reviewer flagged a few things before it goes live:</p>
       <blockquote style="margin:16px 0;padding:12px 16px;background:rgba(230,78,33,0.08);border-radius:12px;">${escape(args.reason).replace(/\n/g, "<br>")}</blockquote>
       <p>Make the updates, then hit <em>Resubmit for review</em>.</p>`,
      { label: "Edit listing", href },
    ),
  };
}

export function newInquiryAdminEmail(args: {
  listingName: string;
  listingId: string;
  buyerEmail: string;
  message: string;
}) {
  const href = `${siteUrl()}/admin/inquiries`;
  return {
    subject: `New inquiry: ${args.listingName}`,
    html: shell(
      "New buyer inquiry",
      `<p><strong>${escape(args.buyerEmail)}</strong> is interested in <strong>${escape(args.listingName)}</strong>.</p>
       <blockquote style="margin:16px 0;padding:12px 16px;background:rgba(0,0,0,0.04);border-radius:12px;">${escape(args.message).replace(/\n/g, "<br>")}</blockquote>`,
      { label: "Open inquiries", href },
    ),
  };
}

export function newInquirySellerEmail(args: {
  listingName: string;
  message: string;
  slug: string;
}) {
  const href = `${siteUrl()}/sell/inquiries`;
  return {
    subject: `New buyer interest in ${args.listingName}`,
    html: shell(
      "A buyer is interested",
      `<p>Someone just reached out about <strong>${escape(args.listingName)}</strong>. We'll verify and intro them — no action needed from you yet.</p>
       <blockquote style="margin:16px 0;padding:12px 16px;background:rgba(0,0,0,0.04);border-radius:12px;">${escape(args.message).replace(/\n/g, "<br>")}</blockquote>`,
      { label: "View inquiries", href },
    ),
  };
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
