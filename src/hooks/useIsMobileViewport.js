import { useEffect, useState } from 'react';

export function useIsMobileViewport(breakpoint = 768) {
  const supportsMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  const [isMobile, setIsMobile] = useState(() =>
    supportsMatchMedia ? window.matchMedia(`(max-width: ${breakpoint}px)`).matches : false
  );

  useEffect(() => {
    if (!supportsMatchMedia) return undefined;
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const listener = (event) => setIsMobile(event.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [breakpoint, supportsMatchMedia]);

  return isMobile;
}
