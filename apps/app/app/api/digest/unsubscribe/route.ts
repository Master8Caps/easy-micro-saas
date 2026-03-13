import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid");
  if (!uid) {
    return new NextResponse("Missing user ID", { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update({ digest_unsubscribed: true })
    .eq("id", uid);

  if (error) {
    return new NextResponse("Failed to unsubscribe", { status: 500 });
  }

  return new NextResponse(
    `<html>
      <body style="background:#09090b;color:#f4f4f5;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
        <div style="text-align:center;">
          <h1 style="font-size:20px;margin-bottom:8px;">Unsubscribed</h1>
          <p style="color:#71717a;">You won't receive weekly digest emails anymore.</p>
        </div>
      </body>
    </html>`,
    { headers: { "Content-Type": "text/html" } },
  );
}
