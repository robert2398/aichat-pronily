import { useEffect, useRef, useState } from 'react';

// Simple useInView hook: returns a ref to attach and a boolean inView.
export default function useInView({ root = null, rootMargin = '0px', threshold = 0 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    const el = ref.current;
    if (typeof IntersectionObserver === 'undefined') {
      // If IntersectionObserver isn't available, fall back to visible
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      if (cancelled) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) setInView(true);
      });
    }, { root, rootMargin, threshold });

    obs.observe(el);
    return () => {
      cancelled = true;
      try { obs.unobserve(el); } catch (e) {}
      try { obs.disconnect(); } catch (e) {}
    };
  }, [root, rootMargin, threshold]);

  return [ref, inView];
}
