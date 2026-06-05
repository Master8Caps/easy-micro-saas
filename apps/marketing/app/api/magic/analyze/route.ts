import { NextResponse } from "next/server";
import { normaliseUrl } from "@/lib/magic/validation";
import { fetchBrandSignals } from "@/lib/magic/scrape";
import { generateMagicResult } from "@/lib/magic/generate";
import { createLead, findRecentResultByUrl } from "@/lib/magic/store";
import { isRateLimited } from "@/lib/magic/rate-limit";

export async function POST(request: Request) {
  let body: { url?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const url = normaliseUrl(body.url ?? "");
  if (!url) {
    return NextResponse.json(
      { error: "Please enter a valid website address." },
      { status: 400 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "You've hit today's limit. Try again tomorrow." },
      { status: 429 },
    );
  }

  try {
    // Dedupe: reuse a recent generation for this URL, but still make a fresh lead row.
    let result = await findRecentResultByUrl(url);

    if (!result) {
      const signals = await fetchBrandSignals(url);
      if (signals.thin && !body.description) {
        return NextResponse.json({ needsDescription: true });
      }
      result = await generateMagicResult(signals, body.description);
    }

    const id = await createLead(url, result);
    if (!id) {
      return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }

    return NextResponse.json({ id, result });
  } catch (err) {
    console.error("magic/analyze error:", err);
    return NextResponse.json(
      { error: "We couldn't build your result. Please try again." },
      { status: 500 },
    );
  }
}
