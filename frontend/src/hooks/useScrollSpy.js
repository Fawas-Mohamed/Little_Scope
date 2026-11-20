import { useEffect, useState } from 'react';
// which section crosses the middle of the screen
export function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0]);
  const idsKey = ids.join('|');
  useEffect(() => {
    const idList = idsKey.split('|');
    const onPinChange = (event) => setActive(event.detail);
    window.addEventListener('showcasepinchange', onPinChange);
    const regular = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    idList.filter((id) => id !== 'flavours').forEach((id) => {
      const el = document.getElementById(id);
      if (el) regular.observe(el);
    });

    const track = document.getElementById('flavours');
    const start = track?.querySelector('.showcase-pin-start');
    const end = track?.querySelector('.showcase-pin-end');
    const sticky = track?.querySelector('.showcase');
    const trackTop = track ? track.getBoundingClientRect().top + window.scrollY : 0;
    const releaseTop = track && sticky ? trackTop + track.clientHeight - sticky.clientHeight : 0;
    if (track && sticky) {
      if (window.scrollY >= trackTop && window.scrollY <= releaseTop) setActive('flavours');
      else if (window.scrollY > releaseTop) setActive(idList[idList.indexOf('flavours') + 1] ?? idList[idList.length - 1]);
    }
    let lastY = window.scrollY;
    const pin = new IntersectionObserver((entries) => {
      const y = window.scrollY, direction = Math.sign(y - lastY);
      lastY = y;
      entries.forEach((entry) => {
        if (entry.target === start) {
          if (entry.isIntersecting && direction > 0) setActive('flavours');
          else if (!entry.isIntersecting && direction < 0) setActive(idList[idList.indexOf('flavours') - 1] ?? idList[0]);
        } else if (entry.target === end) {
          if (entry.isIntersecting || direction < 0) setActive('flavours');
          else if (direction > 0) setActive('reviews');
        }
      });
    }, { rootMargin: '0px 0px -99% 0px' });
    if (start) pin.observe(start);
    if (end) pin.observe(end);
    return () => {
      window.removeEventListener('showcasepinchange', onPinChange);
      regular.disconnect();
      pin.disconnect();
    };
  }, [idsKey]);
  return active;
}
