export type Treatment = "gradient" | "darkAccent" | "solid";

export interface PlatformTheme {
  /** width / height of the graphic. */
  aspect: number;
  treatment: Treatment;
  headlineScale: "lg" | "md" | "sm";
  emoji: boolean;
  hashtag: boolean;
  subhead: boolean;
  /** Show 2-3 supporting sentences (the caption) under the headline. */
  body: boolean;
  /** Max lines of body text before clamping (0 when body is off). */
  bodyLines: number;
}

const THEMES: Record<string, PlatformTheme> = {
  instagram: { aspect: 1, treatment: "gradient", headlineScale: "md", emoji: true, hashtag: true, subhead: false, body: true, bodyLines: 5 },
  facebook: { aspect: 1, treatment: "gradient", headlineScale: "md", emoji: true, hashtag: true, subhead: false, body: true, bodyLines: 5 },
  linkedin: { aspect: 1.91, treatment: "darkAccent", headlineScale: "sm", emoji: false, hashtag: false, subhead: true, body: true, bodyLines: 3 },
  x: { aspect: 1.78, treatment: "solid", headlineScale: "lg", emoji: false, hashtag: true, subhead: false, body: false, bodyLines: 0 },
  twitter: { aspect: 1.78, treatment: "solid", headlineScale: "lg", emoji: false, hashtag: true, subhead: false, body: false, bodyLines: 0 },
};

const DEFAULT_THEME: PlatformTheme = THEMES.instagram;

/** Platform-dependent render config; case-insensitive, safe default for unknowns. */
export function platformTheme(platform: string): PlatformTheme {
  return THEMES[platform.trim().toLowerCase()] ?? DEFAULT_THEME;
}
