export type SiteVariant = "techy" | "calm";

export function resolveVariant(value: string | undefined): SiteVariant {
  return value === "calm" ? "calm" : "techy";
}

export const SITE_VARIANT: SiteVariant = resolveVariant(
  process.env.NEXT_PUBLIC_SITE_VARIANT,
);

export interface AppBrand {
  variant: SiteVariant;
  name: string; // wordmark shown in the app UI
  title: string; // browser/document title
}

export const APP_BRANDS: Record<SiteVariant, AppBrand> = {
  techy: { variant: "techy", name: "Easy Micro SaaS", title: "Marketing Machine" },
  calm: { variant: "calm", name: "Taiga", title: "Taiga" },
};

export const APP_BRAND: AppBrand = APP_BRANDS[SITE_VARIANT];
