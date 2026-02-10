import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  // Mocked response — will be replaced with Anthropic LLM integration
  const result = {
    product: body.product || "Untitled Product",
    avatars: [
      {
        id: "avatar-1",
        name: "Solo Technical Founder",
        description:
          "Building alone, strong on product, weak on distribution. Needs a system to market consistently without a team.",
        channels: ["LinkedIn", "X/Twitter", "Indie Hackers"],
        painPoints: [
          "No marketing system",
          "Posts inconsistently",
          "No feedback on what works",
        ],
      },
      {
        id: "avatar-2",
        name: "Non-Technical Indie Hacker",
        description:
          "Has an idea and hustle, needs a structured approach to validate positioning and acquire early users.",
        channels: ["X/Twitter", "Reddit", "Product Hunt"],
        painPoints: [
          "Overwhelmed by options",
          "No technical marketing skills",
          "Guessing at channels",
        ],
      },
    ],
    campaigns: [
      {
        id: "campaign-1",
        avatarId: "avatar-1",
        angle: "The 'I shipped but nobody came' pain point",
        channel: "LinkedIn",
        hook: "You spent 3 months building. You've spent 3 days marketing. Here's why that ratio is killing your product.",
        contentType: "text-post",
      },
      {
        id: "campaign-2",
        avatarId: "avatar-2",
        angle: "The 'tools won't save you' realization",
        channel: "X/Twitter",
        hook: "You don't need another tool. You need a system that tells you what to post, where, and why.",
        contentType: "thread",
      },
    ],
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(result);
}
