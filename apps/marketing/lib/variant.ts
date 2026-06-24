export type SiteVariant = "techy" | "calm";

export function resolveVariant(value: string | undefined): SiteVariant {
  return value === "calm" ? "calm" : "techy";
}

export const SITE_VARIANT: SiteVariant = resolveVariant(
  process.env.NEXT_PUBLIC_SITE_VARIANT,
);

export interface BrandConfig {
  variant: SiteVariant;
  name: string;
  domain: string;
  tagline: string;
  gaId?: string;
  metaTitle: string;
  metaDescription: string;
}

export const BRANDS: Record<SiteVariant, BrandConfig> = {
  techy: {
    variant: "techy",
    name: "Easy Micro SaaS",
    domain: "easymicrosaas.com",
    tagline: "Your Go-To-Market Engine",
    gaId: process.env.NEXT_PUBLIC_GA_ID ?? "G-D03VRT08J9",
    metaTitle: "Easy Micro SaaS — Your Go-To-Market Engine",
    metaDescription:
      "Turn a product brief into targeted campaigns, content, and tracking. Find your first 100 users faster.",
  },
  calm: {
    variant: "calm",
    name: "Taiga",
    domain: "gettaiga.com",
    tagline: "Grow your business. Stay calm.",
    // Calm GA is per-deployment: undefined until NEXT_PUBLIC_GA_ID is set, which intentionally omits GA.
    gaId: process.env.NEXT_PUBLIC_GA_ID,
    metaTitle: "Taiga — Grow your business. Stay calm.",
    metaDescription:
      "Drop in your website and Taiga quietly runs your social, ads, email and blog — marketing on autopilot, so you never have to become a marketer.",
  },
};

export const BRAND: BrandConfig = BRANDS[SITE_VARIANT];
