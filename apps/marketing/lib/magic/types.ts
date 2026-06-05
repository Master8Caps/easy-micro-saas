// apps/marketing/lib/magic/types.ts

export interface BrandSignals {
  url: string;
  title: string;
  description: string;
  ogImage?: string;
  themeColor?: string;
  favicon?: string;
  headings: string[];
  text: string;
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
}

export interface MagicResult {
  brand: MagicBrand;
  avatars: MagicAvatar[];
  samplePosts: MagicSamplePost[];
}
