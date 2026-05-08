import { useCallback, useEffect, useRef } from "react";

export function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin: "0px 0px -40px 0px",
    });

    const el = ref.current;
    if (el) {
      const revealElements = el.querySelectorAll(".reveal");
      revealElements.forEach((child) => observer.observe(child));
    }

    return () => observer.disconnect();
  }, [handleIntersection, threshold]);

  return ref;
}
