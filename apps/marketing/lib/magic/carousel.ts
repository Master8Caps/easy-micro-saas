/** Clamped (non-wrapping) carousel navigation. */
export function nextIndex(i: number, length: number): number {
  if (length <= 0) return 0;
  return Math.min(i + 1, length - 1);
}

export function prevIndex(i: number, length: number): number {
  if (length <= 0) return 0;
  return Math.max(i - 1, 0);
}
