"use server";

import { resend, EMAIL_FROM } from "@/lib/resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.easymicrosaas.com";

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
              <img src="https://easymicrosaas.com/favicon.svg" width="40" height="40" alt="Easy Micro SaaS" style="display:block;" />
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

    await resend.emails.send({
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

    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Your account is ready — Easy Micro SaaS",
      html,
    });
  } catch (err) {
    console.error("Failed to send activation email:", err);
  }
}
