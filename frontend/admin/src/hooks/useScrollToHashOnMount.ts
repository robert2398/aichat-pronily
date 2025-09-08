import { useEffect } from 'react';

export function useScrollToHashOnMount(onScrolled?: (id: string) => void) {
  useEffect(() => {
    const hash = window.location.hash?.replace('#', '');
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          onScrolled?.(hash);
        });
      }
    }
  }, []);
}
