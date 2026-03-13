"use server";

import { getResend, EMAIL_FROM } from "@/lib/resend";
import type { DigestData } from "./digest";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.easymicrosaas.com";

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Shared template wrapper ─────────────────────────
function emailWrapper(content: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="https://easymicrosaas.com/logo.png" width="40" height="40" alt="Easy Micro SaaS" style="display:block;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color:#18181b;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#71717a;">
                Easy Micro SaaS &middot; easymicrosaas.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Waitlist confirmation email ──────────────────────
export async function sendWaitlistConfirmation(email: string) {
  try {
    const html = emailWrapper(`
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#fafafa;">
        You're on the list
      </h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#a1a1aa;">
        Thanks for signing up for Easy Micro SaaS. We're onboarding users in small batches to ensure the best experience.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a1a1aa;">
        We'll email you at <strong style="color:#e4e4e7;">${email}</strong> as soon as your account is ready.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
        <tr>
          <td style="background-color:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);border-radius:8px;padding:16px 20px;">
            <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#71717a;font-weight:600;">
              What happens next?
            </p>
            <p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
              When your account is activated, you'll receive another email with a direct link to get started. No action needed from you right now.
            </p>
          </td>
        </tr>
      </table>
    `);

    await getResend().emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "You're on the list — Easy Micro SaaS",
      html,
    });
  } catch (err) {
    console.error("Failed to send waitlist confirmation email:", err);
  }
}

// ── Account activation email ─────────────────────────
export async function sendActivationEmail(email: string) {
  try {
    const loginUrl = `${APP_URL}/login`;

    const html = emailWrapper(`
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#fafafa;">
        Your account is ready
      </h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#a1a1aa;">
        Great news — your Easy Micro SaaS account has been activated. You can now sign in and start building your marketing engine.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a1a1aa;">
        Click the button below to get started:
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="background-color:#6366f1;border-radius:8px;">
            <a href="${loginUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
              Sign in to your account
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;line-height:1.5;color:#52525b;">
        Or copy this link: <a href="${loginUrl}" style="color:#818cf8;text-decoration:underline;">${loginUrl}</a>
      </p>
    `);

    await getResend().emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Your account is ready — Easy Micro SaaS",
      html,
    });
  } catch (err) {
    console.error("Failed to send activation email:", err);
  }
}

// ── Weekly digest email ─────────────────────────────
export function buildDigestEmail(data: DigestData, unsubscribeUrl?: string): string {
  const header = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:20px;background-color:#1e1b4b;border-radius:10px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#e0e7ff;">Weekly Performance Digest</h1>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:8px;">
                <p style="margin:0;font-size:24px;font-weight:bold;color:#818cf8;">${data.totalClicksAllProducts}</p>
                <p style="margin:4px 0 0;font-size:11px;color:#a5b4fc;">Total Clicks</p>
              </td>
              <td align="center" style="padding:8px;">
                <p style="margin:0;font-size:24px;font-weight:bold;color:#818cf8;">${data.postsThisWeek}</p>
                <p style="margin:4px 0 0;font-size:11px;color:#a5b4fc;">Posted This Week</p>
              </td>
            </tr>
          </table>
          ${
            data.topPerformer
              ? `<p style="margin:12px 0 0;font-size:12px;color:#a5b4fc;">Top performer: <strong style="color:#e0e7ff;">${escHtml(data.topPerformer.title)}</strong> (${escHtml(data.topPerformer.channel)})</p>`
              : ""
          }
        </td>
      </tr>
    </table>
  `;

  let productCards = "";
  if (data.products.length > 0) {
    const cards = data.products
      .map(
        (p) => `
      <tr>
        <td style="padding:12px 16px;background-color:#27272a;border-radius:8px;margin-bottom:8px;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#f4f4f5;">${escHtml(p.name)}</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:11px;color:#a1a1aa;">Clicks: <strong style="color:#f4f4f5;">${p.totalClicks}</strong></td>
              <td style="font-size:11px;color:#a1a1aa;">Views: <strong style="color:#f4f4f5;">${p.totalViews}</strong></td>
              <td style="font-size:11px;color:#a1a1aa;">Likes: <strong style="color:#f4f4f5;">${p.totalLikes}</strong></td>
            </tr>
            <tr>
              <td style="font-size:11px;color:#a1a1aa;">Comments: <strong style="color:#f4f4f5;">${p.totalComments}</strong></td>
              <td style="font-size:11px;color:#a1a1aa;">Shares: <strong style="color:#f4f4f5;">${p.totalShares}</strong></td>
              <td></td>
            </tr>
          </table>
          ${
            p.topPiece
              ? `<p style="margin:8px 0 0;font-size:11px;color:#71717a;">Best: <span style="color:#a5b4fc;">${escHtml(p.topPiece.title)}</span> (${escHtml(p.topPiece.channel)}) — Score: ${Math.round(p.topPiece.compositeScore)}</p>`
              : ""
          }
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
    `,
      )
      .join("");

    const moreProducts =
      data.totalProductCount > 5
        ? `<tr><td style="padding:8px 0;text-align:center;font-size:12px;color:#71717a;"><a href="${APP_URL}" style="color:#818cf8;text-decoration:underline;">and ${data.totalProductCount - 5} more product${data.totalProductCount - 5 === 1 ? "" : "s"}</a></td></tr>`
        : "";

    productCards = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td>
            <h2 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.05em;">Your Products</h2>
          </td>
        </tr>
        ${cards}
        ${moreProducts}
      </table>
    `;
  }

  const actions: string[] = [];
  if (data.actionItems.readyToPost > 0)
    actions.push(
      `<li style="margin-bottom:6px;"><span style="color:#34d399;">&#10003;</span> <strong>${data.actionItems.readyToPost}</strong> piece${data.actionItems.readyToPost === 1 ? "" : "s"} ready to post</li>`,
    );
  if (data.actionItems.scheduledThisWeek > 0)
    actions.push(
      `<li style="margin-bottom:6px;"><span style="color:#818cf8;">&#9650;</span> <strong>${data.actionItems.scheduledThisWeek}</strong> scheduled this week</li>`,
    );
  if (data.actionItems.campaignsWithNoContent > 0)
    actions.push(
      `<li style="margin-bottom:6px;"><span style="color:#fbbf24;">&#9679;</span> <strong>${data.actionItems.campaignsWithNoContent}</strong> campaign${data.actionItems.campaignsWithNoContent === 1 ? "" : "s"} with no content yet</li>`,
    );

  const actionSection =
    actions.length > 0
      ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td>
          <h2 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.05em;">Action Items</h2>
          <ul style="margin:0;padding-left:16px;color:#d4d4d8;font-size:13px;list-style:none;">
            ${actions.join("")}
          </ul>
        </td>
      </tr>
    </table>
  `
      : "";

  const cta = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-top:8px;">
          <a href="${APP_URL}" style="display:inline-block;padding:10px 24px;background-color:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
            Open Dashboard
          </a>
        </td>
      </tr>
    </table>
  `;

  const unsubFooter = unsubscribeUrl
    ? `<p style="text-align:center;margin-top:16px;font-size:11px;color:#52525b;"><a href="${unsubscribeUrl}" style="color:#71717a;">Unsubscribe from digest emails</a></p>`
    : "";

  return emailWrapper(header + productCards + actionSection + cta + unsubFooter);
}
