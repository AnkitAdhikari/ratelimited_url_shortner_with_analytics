import { useLottie } from 'lottie-react';
import { useEffect } from 'react';

interface Props {
  animationData: object;
  loop?: boolean;
  size?: string;
  ariaLabel?: string;
}

// uses the useLottie hook (named export) — the default <Lottie /> component export
// breaks under Vite's CJS/ESM interop and renders as a plain object
export default function LottieBox({ animationData, loop = true, size = '8rem', ariaLabel }: Props) {
  const { View, animationLoaded, getDuration, goToAndStop } = useLottie(
    { animationData, loop, autoplay: true },
    { width: size, height: size },
  );

  // reduced motion: show the final frame instead of animating
  useEffect(() => {
    if (!animationLoaded) return;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const frames = getDuration(true);
    if (frames !== undefined) goToAndStop(Math.max(0, frames - 1), true);
  }, [animationLoaded, getDuration, goToAndStop]);

  return (
    // inline-block so parent centering applies
    <div role="img" aria-label={ariaLabel} style={{ display: 'inline-block' }}>
      {View}
    </div>
  );
}
