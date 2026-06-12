export type Treatment = "gradient" | "darkAccent" | "solid";

export interface PlatformTheme {
  /** width / height of the graphic. */
  aspect: number;
  treatment: Treatment;
  headlineScale: "lg" | "md" | "sm";
  emoji: boolean;
  hashtag: boolean;
  subhead: boolean;
}

const THEMES: Record<string, PlatformTheme> = {
  instagram: { aspect: 1, treatment: "gradient", headlineScale: "lg", emoji: true, hashtag: true, subhead: false },
  facebook: { aspect: 1, treatment: "gradient", headlineScale: "lg", emoji: true, hashtag: true, subhead: false },
  linkedin: { aspect: 1.91, treatment: "darkAccent", headlineScale: "md", emoji: false, hashtag: false, subhead: true },
  x: { aspect: 1.78, treatment: "solid", headlineScale: "lg", emoji: false, hashtag: true, subhead: false },
  twitter: { aspect: 1.78, treatment: "solid", headlineScale: "lg", emoji: false, hashtag: true, subhead: false },
};

const DEFAULT_THEME: PlatformTheme = THEMES.instagram;

/** Platform-dependent render config; case-insensitive, safe default for unknowns. */
export function platformTheme(platform: string): PlatformTheme {
  return THEMES[platform.trim().toLowerCase()] ?? DEFAULT_THEME;
}
