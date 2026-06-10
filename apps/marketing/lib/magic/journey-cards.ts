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
