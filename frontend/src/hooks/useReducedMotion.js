import { useEffect, useState } from 'react';
export function useReducedMotion() {
  const q = '(prefers-reduced-motion: reduce)';
  const [v, setV] = useState(() => window.matchMedia(q).matches);
  useEffect(() => { const m = window.matchMedia(q); const on = () => setV(m.matches); m.addEventListener('change', on); return () => m.removeEventListener('change', on); }, []);
  return v;
}
