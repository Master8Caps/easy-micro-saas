export interface JourneySamplePost {
  platform: string;
  caption: string;
  tag: string;
  /** Code-built background — no image generation needed. */
  gradient: string;
}

/** Marketing-Machine branded sample posts — same for every visitor. */
export const JOURNEY_SAMPLE_POSTS: JourneySamplePost[] = [
  {
    platform: "Instagram",
    caption: "You built it. We market it. ✨",
    tag: "#marketingmachine",
    gradient: "linear-gradient(135deg, #6366f1, #a855f7)",
  },
  {
    platform: "LinkedIn",
    caption: "Your whole funnel — drafted while you sleep.",
    tag: "#growth",
    gradient: "linear-gradient(135deg, #0ea5e9, #6366f1)",
  },
  {
    platform: "X",
    caption: "Swipe to approve. We post the rest. 🚀",
    tag: "#buildinpublic",
    gradient: "linear-gradient(135deg, #f43f5e, #a855f7)",
  },
  {
    platform: "Instagram",
    caption: "Ads, email, blog, socials — one machine.",
    tag: "#saas",
    gradient: "linear-gradient(135deg, #10b981, #0ea5e9)",
  },
];

export interface SwipeExample {
  /** "reject" → must swipe LEFT; "approve" → must swipe RIGHT. */
  expected: "reject" | "approve";
  platform: string;
  caption: string;
  gradient: string;
  /** One-line reason shown after they swipe correctly. */
  lesson: string;
}

/** The forced teaching beat: bin a weak post, approve a strong one. */
export const SWIPE_EXAMPLES: SwipeExample[] = [
  {
    expected: "reject",
    platform: "Instagram",
    caption: "BUY NOW!!! 50% OFF EVERYTHING!!! LINK IN BIO!!!",
    gradient: "linear-gradient(135deg, #71717a, #3f3f46)",
    lesson: "Spammy and off-brand — bin it. We never post like this.",
  },
  {
    expected: "approve",
    platform: "Instagram",
    caption: "The quiet win: a calmer week, because the busywork ran itself. ✨",
    gradient: "linear-gradient(135deg, #6366f1, #a855f7)",
    lesson: "On-brand, human, on-message — approve it. This is your voice.",
  },
];
