import { useEffect, useState } from 'react';
const read = () => ({ w: window.innerWidth, h: window.innerHeight, mobile: window.innerWidth <= 820 || window.innerHeight > window.innerWidth });
export function useViewport() {
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const on = () => setVp(read());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('orientationchange', on); };
  }, []);
  return vp;
}
