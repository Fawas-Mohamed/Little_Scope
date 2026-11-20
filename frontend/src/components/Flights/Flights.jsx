import { useEffect, useLayoutEffect, useRef } from 'react';
import BowlArt from '../../art/BowlArt.jsx';
import { peekImg } from '../../data/productImages.js';
import './Flights.css';

// PERLÉ "put in bag" flight: the scoop lifts, shrinks and drops into the bag (or the nav Cart on phones).
function Flight({ flight, onDone }) {
  const ref = useRef(null);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; }, [onDone]);
  useLayoutEffect(() => {
    const el = ref.current;
    const targets = [...document.querySelectorAll('[data-fly-target]')].filter((t) => { const r = t.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; });
    const t = targets[0]?.getBoundingClientRect();
    const dx = t ? t.left + t.width / 2 - flight.cx : 0;
    const dy = t ? t.top + t.height / 2 - flight.cy : -200;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { done.current(); return undefined; }
    const anim = el.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * .06}px,-34px) scale(.92)`, opacity: 1, offset: .2 },
      { transform: `translate(${dx * .45}px,${dy * .2}px) scale(.6)`, opacity: 1, offset: .48 },
      { transform: `translate(${dx * .85}px,${dy * .72}px) scale(.3)`, opacity: 1, offset: .76 },
      { transform: `translate(${dx}px,${dy}px) scale(.14)`, opacity: .9, offset: .9 },
      { transform: `translate(${dx}px,${dy + 40}px) scale(.12)`, opacity: 0 },
    ], { delay: 120, duration: 820, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' });
    anim.onfinish = () => done.current();
    return () => anim.cancel();
  }, [flight.cx, flight.cy]);
  const W = 200, H = (200 * 1168) / 876;
  return (
    <div ref={ref} className="flight" style={{ left: flight.cx - W / 2, top: flight.cy - H / 2, width: W, height: H }}>
      {peekImg(flight.flavour.id) ? <img src={peekImg(flight.flavour.id)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <div style={{ width: 876, height: 1168, transform: `scale(${W / 876})`, transformOrigin: '0 0' }}><BowlArt flavour={flight.flavour} peek /></div>}
    </div>
  );
}
export default function Flights({ flights, onDone }) {
  return <>{flights.map((f) => <Flight key={f.id} flight={f} onDone={() => onDone(f)} />)}</>;
}
