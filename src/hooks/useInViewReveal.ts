import { useEffect, useRef, useState } from 'react';

/**
 * One-shot reveal: once the element intersects the viewport, stays revealed.
 */
export function useInViewReveal<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T | null>(null);
  const [isRevealed, setIsRevealed] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setIsRevealed(true);
      return;
    }

    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsRevealed(true);
        }
      },
      { root: null, rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [enabled]);

  return { ref, isRevealed };
}
