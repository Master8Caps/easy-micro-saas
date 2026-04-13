export type ContextItem = { slug: string; name: string };
export type ContextGroup = {
  label: string;
  description: string;
  items: ContextItem[];
};

export const BLOG_CONTEXT: ContextGroup[] = [
  {
    label: "target-audience",
    description:
      "The reader personas this site is written for. Blog content should resonate with these groups — solo founders and indie hackers running a single product, not enterprise teams.",
    items: [
      { slug: "solo-founder", name: "Solo Founder" },
      { slug: "indie-hacker", name: "Indie Hacker" },
      { slug: "micro-saas-operator", name: "Micro-SaaS Operator" },
      { slug: "bootstrapper", name: "Bootstrapper" },
      { slug: "technical-founder", name: "Technical Founder" },
      { slug: "non-technical-founder", name: "Non-Technical Founder" },
      { slug: "side-project-builder", name: "Side-Project Builder" },
    ],
  },
  {
    label: "content-themes",
    description:
      "Core topics the brand cares about. Tie posts back to these themes whenever natural — the site's whole value prop is helping founders market what they've already shipped.",
    items: [
      { slug: "go-to-market", name: "Go-to-Market" },
      { slug: "positioning", name: "Positioning" },
      { slug: "campaign-angles", name: "Campaign Angles" },
      { slug: "avatar-targeting", name: "Avatar Targeting" },
      { slug: "tracked-links", name: "Tracked Links" },
      { slug: "ready-to-post-content", name: "Ready-to-Post Content" },
      { slug: "post-launch-marketing", name: "Post-Launch Marketing" },
    ],
  },
  {
    label: "brand-voice",
    description:
      "Tone the content should be written in. Think founder-to-founder — practical, direct, no fluff. Avoid corporate speak, hype, and fake urgency.",
    items: [
      { slug: "direct", name: "Direct" },
      { slug: "practical", name: "Practical" },
      { slug: "no-fluff", name: "No Fluff" },
      { slug: "founder-to-founder", name: "Founder-to-Founder" },
      { slug: "slightly-casual", name: "Slightly Casual" },
      { slug: "actionable", name: "Actionable" },
    ],
  },
  {
    label: "product-context",
    description:
      "What the Easy Micro SaaS product actually does, so the AI can tie in naturally without being salesy. Use these capabilities as examples or case backdrops when relevant.",
    items: [
      { slug: "turns-brief-into-avatars", name: "Turns Brief Into Avatars" },
      { slug: "generates-campaign-angles", name: "Generates Campaign Angles" },
      {
        slug: "creates-ready-to-post-content",
        name: "Creates Ready-to-Post Content",
      },
      { slug: "provides-tracked-links", name: "Provides Tracked Links" },
      { slug: "measures-what-works", name: "Measures What Works" },
    ],
  },
  {
    label: "avoid",
    description:
      "Topics that do NOT fit this brand. Skip any content angle that falls into these buckets — they're either off-audience or damage credibility.",
    items: [
      { slug: "enterprise-sales", name: "Enterprise Sales" },
      { slug: "vc-fundraising", name: "VC Fundraising" },
      { slug: "hiring-teams", name: "Hiring Teams" },
      { slug: "crypto-web3", name: "Crypto / Web3" },
      {
        slug: "ai-hype-without-substance",
        name: "AI Hype Without Substance",
      },
    ],
  },
];
