import { useEffect, useRef, useState } from 'react';

export const useScrollAnimation = () => {
  const elementRef = useRef<HTMLHeadingElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const target = elementRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasBeenVisible) {
          setIsVisible(true);
          setHasBeenVisible(true);
        }
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -80px 0px'
      }
    );

    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasBeenVisible]);

  return { elementRef, isVisible };
};
