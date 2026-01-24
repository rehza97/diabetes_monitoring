import { useState, useEffect, useRef } from "react";

interface UseCountUpOptions {
  duration?: number;
  startOnView?: boolean;
  decimals?: number;
}

export function useCountUp(
  end: number,
  options: UseCountUpOptions = {}
): { count: number; isCounting: boolean; elementRef: React.RefObject<HTMLDivElement> } {
  const { duration = 2000, startOnView = true, decimals = 0 } = options;
  const [count, setCount] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const hasStarted = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!startOnView) {
      startCounting();
      return;
    }

    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted.current) {
            hasStarted.current = true;
            startCounting();
          }
        });
      },
      { threshold: 0.5 }
    );

    observerRef.current = observer;

    // Observe a dummy element or use a ref
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (observerRef.current && elementRef.current) {
        observerRef.current.unobserve(elementRef.current);
      }
    };
  }, [startOnView]);

  const startCounting = () => {
    setIsCounting(true);
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (end - startValue) * easeOut;

      setCount(Number(currentValue.toFixed(decimals)));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsCounting(false);
      }
    };

    requestAnimationFrame(animate);
  };

  return { count, isCounting, elementRef: elementRef as React.RefObject<HTMLDivElement> };
}
