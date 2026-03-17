import type { Platform, PlatformAdapter } from "./types";
import { metaManualAdapter } from "./meta-manual";
import { googleManualAdapter } from "./google-manual";
import { linkedinManualAdapter } from "./linkedin-manual";
import { tiktokManualAdapter } from "./tiktok-manual";

const adapters: Record<Platform, PlatformAdapter> = {
  meta: metaManualAdapter,
  google: googleManualAdapter,
  linkedin: linkedinManualAdapter,
  tiktok: tiktokManualAdapter,
};

export function getAdapter(platform: Platform): PlatformAdapter {
  return adapters[platform];
}

export { type Platform, type PlatformAdapter } from "./types";
