import { NextResponse } from "next/server";
import { isValidEmail } from "@/lib/magic/validation";
import { attachEmail, getLead } from "@/lib/magic/store";
import { sendBrandDnaEmail } from "@/lib/magic/email";

export async function POST(request: Request) {
  let body: { id?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, email } = body;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email." },
      { status: 400 },
    );
  }

  const lead = await getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Result not found." }, { status: 404 });
  }

  await attachEmail(id, email);
  // Fire-and-forget; errors are logged inside the helper.
  void sendBrandDnaEmail(email, id, lead.result);

  return NextResponse.json({ success: true });
}
