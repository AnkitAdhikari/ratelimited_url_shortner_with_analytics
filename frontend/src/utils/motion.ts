// single home for the app's motion policy, shared by all animation code
const reducedMotionQuery =
  typeof window === 'undefined' ? null : window.matchMedia('(prefers-reduced-motion: reduce)');

export function prefersReducedMotion(): boolean {
  return reducedMotionQuery?.matches ?? false;
}
