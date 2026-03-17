import type {
  PlatformAdapter,
  AdInput,
  DeploymentPackage,
  ValidationResult,
  CreativeSpecs,
  RawPerformanceInput,
  NormalizedPerformance,
} from "./types";

const TIKTOK_SPECS: CreativeSpecs = {
  headlineMaxLength: 100,
  bodyMaxLength: 100,
  imageFormats: [
    { name: "Vertical (9:16)", width: 1080, height: 1920 },
    { name: "Square (1:1)", width: 1080, height: 1080 },
  ],
  ctaOptions: [
    "Learn More",
    "Shop Now",
    "Sign Up",
    "Download",
    "Contact Us",
    "Get Quote",
    "Subscribe",
    "Order Now",
  ],
  videoSpecs: {
    maxDuration: 60,
    aspectRatios: ["9:16", "1:1", "16:9"],
  },
};

function formatAudience(targeting: Record<string, unknown>): string {
  const parts: string[] = [];
  if (targeting.ageMin || targeting.ageMax) {
    parts.push(`Ages ${targeting.ageMin ?? 18}-${targeting.ageMax ?? 55}`);
  }
  if (Array.isArray(targeting.locations) && targeting.locations.length > 0) {
    parts.push(targeting.locations.join(", "));
  }
  if (Array.isArray(targeting.interests) && targeting.interests.length > 0) {
    parts.push(`Interests: ${targeting.interests.join(", ")}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Broad audience";
}

export const tiktokManualAdapter: PlatformAdapter = {
  platform: "tiktok",

  generatePackage(ad: AdInput): DeploymentPackage {
    return {
      platform: "tiktok",
      campaignName: ad.campaignName,
      objective: ad.objective,
      headline: ad.headline,
      body: ad.body,
      cta: ad.cta,
      imageUrl: ad.imageUrl,
      imageSpecs: TIKTOK_SPECS.imageFormats[0],
      audienceSummary: formatAudience(ad.audienceTargeting),
      budgetRecommendation: `$${ad.dailyBudget}/day`,
      deploymentSteps: [
        "Open TikTok Ads Manager → Create campaign",
        `Select "${ad.objective}" as advertising objective`,
        "Create ad group → set targeting and placements",
        "Upload video or image creative",
        "Add ad text, CTA, and destination URL",
        `Set daily budget to $${ad.dailyBudget}`,
        "Submit for review",
      ],
    };
  },

  formatInstructions(ad: AdInput): string[] {
    return [
      "Open TikTok Ads Manager → Create campaign",
      `Select "${ad.objective}" as advertising objective`,
      "Create ad group → set targeting and placements",
      "Upload video or image creative",
      "Add ad text, CTA, and destination URL",
      `Set daily budget to $${ad.dailyBudget}`,
      "Submit for review",
    ];
  },

  parsePerformance(input: RawPerformanceInput): NormalizedPerformance {
    return { ...input, source: "manual" };
  },

  validateCreative(ad: AdInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (ad.headline.length > TIKTOK_SPECS.headlineMaxLength) {
      errors.push(
        `Ad text exceeds ${TIKTOK_SPECS.headlineMaxLength} chars (${ad.headline.length})`,
      );
    }
    if (!ad.imageUrl && !ad.videoUrl) {
      warnings.push(
        "TikTok ads perform best with video — consider creating a video creative",
      );
    }
    if (!ad.destinationUrl) {
      errors.push("Destination URL is required");
    }

    return { valid: errors.length === 0, errors, warnings };
  },

  getCreativeSpecs(): CreativeSpecs {
    return TIKTOK_SPECS;
  },
};
