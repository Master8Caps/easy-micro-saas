import type {
  PlatformAdapter,
  AdInput,
  DeploymentPackage,
  ValidationResult,
  CreativeSpecs,
  RawPerformanceInput,
  NormalizedPerformance,
} from "./types";

const GOOGLE_SPECS: CreativeSpecs = {
  headlineMaxLength: 30,
  bodyMaxLength: 90,
  imageFormats: [
    { name: "Landscape", width: 1200, height: 628 },
    { name: "Square", width: 1200, height: 1200 },
    { name: "Portrait", width: 960, height: 1200 },
  ],
  ctaOptions: [
    "Learn More",
    "Get Quote",
    "Apply Now",
    "Contact Us",
    "Sign Up",
    "Subscribe",
    "Shop Now",
    "Book Now",
  ],
};

function formatAudience(targeting: Record<string, unknown>): string {
  const parts: string[] = [];
  if (targeting.ageMin || targeting.ageMax) {
    parts.push(`Ages ${targeting.ageMin ?? 18}-${targeting.ageMax ?? 65}`);
  }
  if (Array.isArray(targeting.locations) && targeting.locations.length > 0) {
    parts.push(targeting.locations.join(", "));
  }
  if (Array.isArray(targeting.keywords) && targeting.keywords.length > 0) {
    parts.push(`Keywords: ${targeting.keywords.join(", ")}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Broad audience";
}

export const googleManualAdapter: PlatformAdapter = {
  platform: "google",

  generatePackage(ad: AdInput): DeploymentPackage {
    return {
      platform: "google",
      campaignName: ad.campaignName,
      objective: ad.objective,
      headline: ad.headline,
      body: ad.body,
      cta: ad.cta,
      imageUrl: ad.imageUrl,
      imageSpecs: GOOGLE_SPECS.imageFormats[0],
      audienceSummary: formatAudience(ad.audienceTargeting),
      budgetRecommendation: `$${ad.dailyBudget}/day`,
      deploymentSteps: [
        "Open Google Ads → Create new campaign",
        `Select "${ad.objective}" as campaign goal`,
        "Choose campaign type (Search, Display, or Performance Max)",
        "Set audience targeting and locations",
        "Create ad group → add headlines and descriptions",
        "Upload images if using Display/PMax",
        `Set daily budget to $${ad.dailyBudget}`,
        "Review and launch",
      ],
    };
  },

  formatInstructions(ad: AdInput): string[] {
    return [
      "Open Google Ads → Create new campaign",
      `Select "${ad.objective}" as campaign goal`,
      "Choose campaign type (Search, Display, or Performance Max)",
      "Set audience targeting and locations",
      "Create ad group → add headlines and descriptions",
      "Upload images if using Display/PMax",
      `Set daily budget to $${ad.dailyBudget}`,
      "Review and launch",
    ];
  },

  parsePerformance(input: RawPerformanceInput): NormalizedPerformance {
    return { ...input, source: "manual" };
  },

  validateCreative(ad: AdInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (ad.headline.length > GOOGLE_SPECS.headlineMaxLength) {
      errors.push(
        `Headline exceeds ${GOOGLE_SPECS.headlineMaxLength} chars (${ad.headline.length})`,
      );
    }
    if (ad.body.length > GOOGLE_SPECS.bodyMaxLength) {
      errors.push(
        `Description exceeds ${GOOGLE_SPECS.bodyMaxLength} chars (${ad.body.length})`,
      );
    }
    if (!ad.destinationUrl) {
      errors.push("Destination URL is required");
    }

    return { valid: errors.length === 0, errors, warnings };
  },

  getCreativeSpecs(): CreativeSpecs {
    return GOOGLE_SPECS;
  },
};
