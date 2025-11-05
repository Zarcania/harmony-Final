import { useEffect } from 'react';

/**
 * Lock the document body scroll while the component is mounted.
 * - Adds overflow: hidden to body
 * - Compensates scrollbar width with padding-right to avoid layout shift
 */
export function useLockBodyScroll(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;

    // Compute scrollbar width to avoid layout shift when hiding it
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, [enabled]);
}

export default useLockBodyScroll;
