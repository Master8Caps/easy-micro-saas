// Art direction for AI post images. This file is the quality lever — tune the
// style directions / quality / negative constraints here after seeing real output.

export interface VisualStyle {
  key: string;
  label: string;
  /** Tone/industry hint so the generator can pick the right style. */
  bestFor: string;
  /** The art-direction fragment injected into the image prompt. */
  direction: string;
}

export const VISUAL_STYLES: Record<string, VisualStyle> = {
  editorial_product: {
    key: "editorial_product",
    label: "Editorial product photography",
    bestFor: "products, ecommerce, food, physical goods, premium brands",
    direction:
      "Premium editorial product photography. Soft natural window light, shallow depth of field, clean uncluttered background, generous negative space, high-end magazine quality.",
  },
  minimal_render: {
    key: "minimal_render",
    label: "Minimal 3D render",
    bestFor: "software, SaaS, apps, tech, fintech, abstract services",
    direction:
      "Minimal soft 3D render. Smooth matte geometric shapes, studio softbox lighting, gentle long shadows, abundant negative space, modern and clean — premium tech brand visual.",
  },
  lifestyle_candid: {
    key: "lifestyle_candid",
    label: "Lifestyle candid",
    bestFor: "services, wellness, communities, consumer brands, people-led",
    direction:
      "Authentic lifestyle photography, a candid unstaged moment, warm natural light, shallow depth of field, premium brand-campaign quality.",
  },
  bold_graphic: {
    key: "bold_graphic",
    label: "Bold graphic / abstract",
    bestFor: "bold or playful brands, agencies, media, events",
    direction:
      "Bold modern graphic composition, confident geometric forms, strong intentional use of the brand colours, contemporary and gallery-quality art direction.",
  },
  styled_flatlay: {
    key: "styled_flatlay",
    label: "Styled flat-lay",
    bestFor: "lifestyle goods, beauty, stationery, food, curated products",
    direction:
      "Overhead styled flat-lay, tastefully arranged objects on a clean surface, soft even daylight, considered composition and props, premium editorial quality.",
  },
};

export const VISUAL_STYLE_KEYS = Object.keys(VISUAL_STYLES);
export const DEFAULT_STYLE_KEY = "minimal_render";

const QUALITY =
  "Professional, polished, high production value. Tasteful, minimal and intentional. Photorealistic where photographic; crisp and well-composed.";
const NEGATIVE =
  "No text, no words, no letters, no captions, no logos, no watermarks, no UI or app screenshots, no charts or graphs. Avoid distorted faces or hands and prefer no visible human faces. Not oversaturated, not cluttered, no cheesy generic stock-photo look.";

export function buildImagePrompt(opts: {
  styleKey?: string;
  brandColors?: string[];
  subject: string;
}): string {
  const style = VISUAL_STYLES[opts.styleKey ?? ""] ?? VISUAL_STYLES[DEFAULT_STYLE_KEY];
  const colours =
    opts.brandColors && opts.brandColors.length
      ? `Use the brand palette as the dominant colour story: ${opts.brandColors.slice(0, 3).join(", ")}.`
      : "";
  return [style.direction, `Subject: ${opts.subject}.`, colours, QUALITY, NEGATIVE]
    .filter(Boolean)
    .join(" ");
}
