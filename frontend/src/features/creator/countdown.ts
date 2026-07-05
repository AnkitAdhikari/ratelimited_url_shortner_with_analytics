export function remainingSeconds(targetMs: number, now: number): number {
  return Math.max(0, Math.ceil((targetMs - now) / 1000));
}
