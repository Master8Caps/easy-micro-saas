import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import { getDigestDataForUser } from "@/server/actions/digest";
import { buildDigestEmail } from "@/server/actions/email";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const resend = getResend();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("digest_unsubscribed", false);

  if (error || !profiles) {
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 },
    );
  }

  let sent = 0;
  let skipped = 0;
  let errors = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
    const batch = profiles.slice(i, i + BATCH_SIZE);

    for (const profile of batch) {
      try {
        const {
          data: { user },
        } = await supabase.auth.admin.getUserById(profile.id);
        if (!user?.email) {
          skipped++;
          continue;
        }

        const digestData = await getDigestDataForUser(profile.id, user.email);
        if (!digestData) {
          skipped++;
          continue;
        }

        const html = buildDigestEmail(digestData);
        const APP_URL =
          process.env.NEXT_PUBLIC_APP_URL || "https://app.easymicrosaas.com";

        await resend.emails.send({
          from: EMAIL_FROM,
          to: user.email,
          subject: "Your Weekly Marketing Digest — Easy Micro SaaS",
          html:
            html +
            `<p style="text-align:center;margin-top:16px;font-size:11px;color:#52525b;"><a href="${APP_URL}/api/digest/unsubscribe?uid=${profile.id}" style="color:#71717a;">Unsubscribe from digest emails</a></p>`,
        });
        sent++;
      } catch (err) {
        console.error(
          `Digest email failed for user ${profile.id}:`,
          err,
        );
        errors++;
      }
    }

    if (i + BATCH_SIZE < profiles.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return NextResponse.json({ sent, skipped, errors });
}
