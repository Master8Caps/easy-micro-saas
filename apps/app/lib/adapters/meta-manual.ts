import type {
  PlatformAdapter,
  AdInput,
  DeploymentPackage,
  ValidationResult,
  CreativeSpecs,
  RawPerformanceInput,
  NormalizedPerformance,
} from "./types";

const META_SPECS: CreativeSpecs = {
  headlineMaxLength: 40,
  bodyMaxLength: 125,
  imageFormats: [
    { name: "Square (Feed)", width: 1080, height: 1080 },
    { name: "Landscape (Feed)", width: 1200, height: 628 },
    { name: "Story/Reel", width: 1080, height: 1920 },
  ],
  ctaOptions: [
    "Learn More",
    "Shop Now",
    "Sign Up",
    "Get Offer",
    "Book Now",
    "Contact Us",
    "Download",
    "Get Quote",
    "Subscribe",
    "Apply Now",
  ],
  videoSpecs: {
    maxDuration: 240,
    aspectRatios: ["1:1", "4:5", "9:16", "16:9"],
  },
};

function formatAudience(targeting: Record<string, unknown>): string {
  const parts: string[] = [];
  if (targeting.ageMin || targeting.ageMax) {
    parts.push(`Ages ${targeting.ageMin ?? 18}-${targeting.ageMax ?? 65}`);
  }
  if (Array.isArray(targeting.locations) && targeting.locations.length > 0) {
    parts.push(targeting.locations.join(", "));
  }
  if (Array.isArray(targeting.interests) && targeting.interests.length > 0) {
    parts.push(`Interests: ${targeting.interests.join(", ")}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Broad audience";
}

export const metaManualAdapter: PlatformAdapter = {
  platform: "meta",

  generatePackage(ad: AdInput): DeploymentPackage {
    return {
      platform: "meta",
      campaignName: ad.campaignName,
      objective: ad.objective,
      headline: ad.headline,
      body: ad.body,
      cta: ad.cta,
      imageUrl: ad.imageUrl,
      imageSpecs: META_SPECS.imageFormats[0],
      audienceSummary: formatAudience(ad.audienceTargeting),
      budgetRecommendation: `$${ad.dailyBudget}/day`,
      deploymentSteps: [
        "Open Meta Ads Manager → Create new campaign",
        `Select "${ad.objective}" as campaign objective`,
        "Create ad set → paste audience targeting",
        "Create ad → paste headline, body, and CTA",
        "Upload the image and set destination URL",
        `Set daily budget to $${ad.dailyBudget}`,
        "Review and publish",
      ],
    };
  },

  formatInstructions(ad: AdInput): string[] {
    return [
      "Open Meta Ads Manager → Create new campaign",
      `Select "${ad.objective}" as campaign objective`,
      "Create ad set → paste audience targeting",
      "Create ad → paste headline, body, and CTA",
      "Upload the image and set destination URL",
      `Set daily budget to $${ad.dailyBudget}`,
      "Review and publish",
    ];
  },

  parsePerformance(input: RawPerformanceInput): NormalizedPerformance {
    return { ...input, source: "manual" };
  },

  validateCreative(ad: AdInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (ad.headline.length > META_SPECS.headlineMaxLength) {
      errors.push(
        `Headline exceeds ${META_SPECS.headlineMaxLength} chars (${ad.headline.length})`,
      );
    }
    if (ad.body.length > META_SPECS.bodyMaxLength) {
      warnings.push(
        `Body exceeds ${META_SPECS.bodyMaxLength} chars — may be truncated in feed`,
      );
    }
    if (!META_SPECS.ctaOptions.includes(ad.cta)) {
      warnings.push(
        `"${ad.cta}" is not a standard Meta CTA — use one of: ${META_SPECS.ctaOptions.join(", ")}`,
      );
    }
    if (!ad.destinationUrl) {
      errors.push("Destination URL is required");
    }

    return { valid: errors.length === 0, errors, warnings };
  },

  getCreativeSpecs(): CreativeSpecs {
    return META_SPECS;
  },
};
