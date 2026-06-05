import { Resend } from "resend";
import { SITE_ORIGIN } from "@/lib/blog/supabase";
import type { MagicResult } from "./types";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendBrandDnaEmail(
  to: string,
  id: string,
  result: MagicResult,
): Promise<void> {
  const link = `${SITE_ORIGIN}/magic/${id}`;
  try {
    await resend.emails.send({
      from: "Easy Micro SaaS <hello@easymicrosaas.com>",
      to,
      subject: `Your Brand DNA for ${result.brand.name}`,
      html: `<!DOCTYPE html><html><body style="margin:0;background:#09090b;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#fafafa;padding:40px 20px">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="480" style="max-width:480px;background:#18181b;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:32px">
<tr><td>
  <h1 style="margin:0 0 12px;font-size:22px">Your Brand DNA is ready</h1>
  <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#a1a1aa">We analysed <strong style="color:#e4e4e7">${escapeHtml(result.brand.name)}</strong> and built your avatars + sample posts. View it any time:</p>
  <a href="${link}" style="display:inline-block;background:#fff;color:#09090b;text-decoration:none;font-weight:700;border-radius:999px;padding:12px 24px;font-size:14px">View your Brand DNA</a>
</td></tr></table>
<p style="margin-top:24px;font-size:12px;color:#71717a">Easy Micro SaaS &middot; easymicrosaas.com</p>
</td></tr></table></body></html>`,
    });
  } catch (err) {
    console.error("sendBrandDnaEmail error:", err);
  }
}
