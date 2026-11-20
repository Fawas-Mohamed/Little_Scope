import { useEffect, useRef } from 'react';
// adds `in` to the element once it scrolls into view (children with .rv fade up). Reduced motion: visible at once.
export function useReveal(threshold = .15) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || typeof IntersectionObserver === 'undefined') { el.classList.add('in'); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); } }, { threshold, rootMargin: '0px 0px -6% 0px' });
    io.observe(el);
    const fail = setTimeout(() => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }, 2500);
    return () => { io.disconnect(); clearTimeout(fail); };
  }, [threshold]);
  return ref;
}
