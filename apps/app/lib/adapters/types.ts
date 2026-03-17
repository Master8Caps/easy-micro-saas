// Platform adapter types — shared interface for all platform adapters.
// Day 1: manual adapters (copy-paste packages). Future: API adapters.

export type Platform = "meta" | "google" | "linkedin" | "tiktok";

export type AdObjective =
  | "awareness"
  | "traffic"
  | "conversions"
  | "engagement"
  | "leads";

export interface ImageFormat {
  name: string;
  width: number;
  height: number;
}

export interface CreativeSpecs {
  headlineMaxLength: number;
  bodyMaxLength: number;
  imageFormats: ImageFormat[];
  ctaOptions: string[];
  videoSpecs?: { maxDuration: number; aspectRatios: string[] };
}

export interface DeploymentPackage {
  platform: Platform;
  campaignName: string;
  objective: string;
  headline: string;
  body: string;
  cta: string;
  imageUrl?: string;
  imageSpecs: ImageFormat;
  audienceSummary: string;
  budgetRecommendation: string;
  deploymentSteps: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AdInput {
  headline: string;
  body: string;
  cta: string;
  imageUrl?: string;
  videoUrl?: string;
  destinationUrl: string;
  audienceTargeting: Record<string, unknown>;
  dailyBudget: number;
  objective: AdObjective;
  campaignName: string;
}

export interface RawPerformanceInput {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
}

export interface NormalizedPerformance {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
  source: "manual" | "csv_import" | "api";
}

export interface PlatformAdapter {
  platform: Platform;
  generatePackage(ad: AdInput): DeploymentPackage;
  formatInstructions(ad: AdInput): string[];
  parsePerformance(input: RawPerformanceInput): NormalizedPerformance;
  validateCreative(ad: AdInput): ValidationResult;
  getCreativeSpecs(): CreativeSpecs;
}
