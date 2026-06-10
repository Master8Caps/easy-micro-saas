// apps/marketing/lib/magic/types.ts

export interface BrandSignals {
  url: string;
  title: string;
  description: string;
  ogImage?: string;
  /** The brand's real logo: apple-touch-icon → apple-touch-icon-precomposed → og:logo, else the favicon. Never the OG image. */
  logoUrl?: string;
  themeColor?: string;
  favicon?: string;
  headings: string[];
  text: string;
  /** Declared/extracted brand colours, most brand-defining first. */
  palette?: string[];
  /** True when the page yielded too little to generate well. */
  thin: boolean;
}

export interface MagicBrand {
  name: string;
  tagline: string;
  tone: string[];
  /** Hex colours, e.g. ["#10b981", "#34d399"]. */
  palette: string[];
  logoUrl?: string;
  positioning: string;
  /** Curated art-direction style key (see lib/magic/image-style.ts). */
  visualStyle?: string;
}

export interface MagicAvatar {
  name: string;
  role: string;
  painPoints: string[];
  channels: string[];
}

export interface MagicSamplePost {
  platform: string;
  caption: string;
  hashtags: string[];
  engagement: { likes: number; comments: number; shares: number };
  /** Concrete, art-directable image subject for this post (no text/logos). */
  imagePrompt?: string;
  /** Populated after AI generation (post-email). Absent → render gradient fallback. */
  imageUrl?: string;
}

export interface MagicResult {
  brand: MagicBrand;
  avatars: MagicAvatar[];
  samplePosts: MagicSamplePost[];
  /** Schema version of the stored result; used to invalidate pre-redesign cache rows. */
  version?: number;
}
