import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import { getDigestDataForUser } from "@/server/actions/digest";
import { buildDigestEmail } from "@/server/actions/digest-email";
import crypto from "crypto";

export const maxDuration = 300;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://app.easymicrosaas.com";

function signUnsubscribe(uid: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(uid).digest("hex");
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
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
        // N+1 getUserById: profiles table lacks email column; acceptable for small user base
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

        const sig = signUnsubscribe(profile.id, secret);
        const unsubscribeUrl = `${APP_URL}/api/digest/unsubscribe?uid=${profile.id}&sig=${sig}`;
        const html = buildDigestEmail(digestData, unsubscribeUrl);

        await resend.emails.send({
          from: EMAIL_FROM,
          to: user.email,
          subject: "Your Weekly Marketing Digest — Easy Micro SaaS",
          html,
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
