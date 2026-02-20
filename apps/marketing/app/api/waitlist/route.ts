import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const body = await request.json();
  const { email, name, source } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 },
    );
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 },
    );
  }

  const normalised = email.toLowerCase().trim();

  // Check if already on the waitlist
  const { data: existing } = await supabase
    .from("waitlist")
    .select("email")
    .eq("email", normalised)
    .maybeSingle();

  const { error } = await supabase.from("waitlist").upsert(
    {
      email: normalised,
      name: name?.trim() || null,
      source: source || "marketing-site",
    },
    { onConflict: "email" },
  );

  if (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  // Send confirmation email for new signups only
  if (!existing) {
    resend.emails.send({
      from: "Easy Micro SaaS <hello@easymicrosaas.com>",
      to: normalised,
      subject: "You're on the list — Easy Micro SaaS",
      html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 20px;"><tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
<tr><td align="center" style="padding-bottom:32px;">
  <img src="https://easymicrosaas.com/favicon.svg" width="40" height="40" alt="Easy Micro SaaS" style="display:block;" />
</td></tr>
<tr><td style="background-color:#18181b;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:32px;">
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#fafafa;">You're on the list</h1>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#a1a1aa;">Thanks for signing up for Easy Micro SaaS. We're onboarding users in small batches to ensure the best experience.</p>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a1a1aa;">We'll email you at <strong style="color:#e4e4e7;">${normalised}</strong> as soon as your account is ready.</p>
  <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr>
    <td style="background-color:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);border-radius:8px;padding:16px 20px;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#71717a;font-weight:600;">What happens next?</p>
      <p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">When your account is activated, you'll receive another email with a direct link to get started. No action needed from you right now.</p>
    </td>
  </tr></table>
</td></tr>
<tr><td align="center" style="padding-top:24px;"><p style="margin:0;font-size:12px;color:#71717a;">Easy Micro SaaS &middot; easymicrosaas.com</p></td></tr>
</table></td></tr></table></body></html>`,
    }).catch((err) => console.error("Failed to send waitlist email:", err));
  }

  return NextResponse.json({ success: true });
}
