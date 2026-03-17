import type {
  PlatformAdapter,
  AdInput,
  DeploymentPackage,
  ValidationResult,
  CreativeSpecs,
  RawPerformanceInput,
  NormalizedPerformance,
} from "./types";

const LINKEDIN_SPECS: CreativeSpecs = {
  headlineMaxLength: 70,
  bodyMaxLength: 150,
  imageFormats: [
    { name: "Sponsored Content", width: 1200, height: 628 },
    { name: "Square", width: 1080, height: 1080 },
    { name: "Vertical", width: 628, height: 1200 },
  ],
  ctaOptions: [
    "Learn More",
    "Sign Up",
    "Register",
    "Subscribe",
    "Download",
    "Get Quote",
    "Apply",
    "Request Demo",
  ],
};

function formatAudience(targeting: Record<string, unknown>): string {
  const parts: string[] = [];
  if (Array.isArray(targeting.jobTitles) && targeting.jobTitles.length > 0) {
    parts.push(`Titles: ${targeting.jobTitles.join(", ")}`);
  }
  if (Array.isArray(targeting.industries) && targeting.industries.length > 0) {
    parts.push(`Industries: ${targeting.industries.join(", ")}`);
  }
  if (Array.isArray(targeting.locations) && targeting.locations.length > 0) {
    parts.push(targeting.locations.join(", "));
  }
  if (targeting.companySize) {
    parts.push(`Company size: ${targeting.companySize}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Professional audience";
}

export const linkedinManualAdapter: PlatformAdapter = {
  platform: "linkedin",

  generatePackage(ad: AdInput): DeploymentPackage {
    return {
      platform: "linkedin",
      campaignName: ad.campaignName,
      objective: ad.objective,
      headline: ad.headline,
      body: ad.body,
      cta: ad.cta,
      imageUrl: ad.imageUrl,
      imageSpecs: LINKEDIN_SPECS.imageFormats[0],
      audienceSummary: formatAudience(ad.audienceTargeting),
      budgetRecommendation: `$${ad.dailyBudget}/day`,
      deploymentSteps: [
        "Open LinkedIn Campaign Manager → Create campaign",
        `Select "${ad.objective}" as objective`,
        "Set audience targeting (job titles, industries, company size)",
        "Choose Sponsored Content as ad format",
        "Create ad → paste headline, body, and CTA",
        "Upload image and set destination URL",
        `Set daily budget to $${ad.dailyBudget}`,
        "Review and launch",
      ],
    };
  },

  formatInstructions(ad: AdInput): string[] {
    return [
      "Open LinkedIn Campaign Manager → Create campaign",
      `Select "${ad.objective}" as objective`,
      "Set audience targeting (job titles, industries, company size)",
      "Choose Sponsored Content as ad format",
      "Create ad → paste headline, body, and CTA",
      "Upload image and set destination URL",
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

    if (ad.headline.length > LINKEDIN_SPECS.headlineMaxLength) {
      errors.push(
        `Headline exceeds ${LINKEDIN_SPECS.headlineMaxLength} chars (${ad.headline.length})`,
      );
    }
    if (ad.body.length > LINKEDIN_SPECS.bodyMaxLength) {
      warnings.push(
        `Introductory text exceeds ${LINKEDIN_SPECS.bodyMaxLength} chars — may be truncated`,
      );
    }
    if (!ad.destinationUrl) {
      errors.push("Destination URL is required");
    }

    return { valid: errors.length === 0, errors, warnings };
  },

  getCreativeSpecs(): CreativeSpecs {
    return LINKEDIN_SPECS;
  },
};
