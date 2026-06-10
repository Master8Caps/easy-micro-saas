import type { MagicResult } from "./types";

/** Bump when the result shape/quality changes so stale cached rows are not reused. */
export const RESULT_VERSION = 2;

/** True if a stored result matches the current schema version. */
export function isCurrentResultVersion(result: Pick<MagicResult, "version">): boolean {
  return result.version === RESULT_VERSION;
}
