import { useCallback, useEffect, useRef, useState } from 'react';
import { useReveal } from '../../hooks/useReveal.js';
import './Reviews.css';

const REVIEWS = [
  { name: 'Amelia R.', flavour: 'Vanilla Bean', color: '#F4E2AE', when: '2 weeks ago', text: 'You can actually see the vanilla seeds. It tastes like the best custard I have ever had, cold. We finished the tub in one evening.' },
  { name: 'Daniel K.', flavour: 'Dark Chocolate', color: '#6B3A2A', when: '1 month ago', text: 'Deep, bitter-sweet and so creamy. This is what chocolate ice cream is supposed to taste like. Ordered again the next day.' },
  { name: 'Sofia M.', flavour: 'Strawberry Cream', color: '#F28FA3', when: '3 weeks ago', text: 'Real strawberries, you can taste the difference immediately. The swirl is perfect and not too sweet. My kids fought over the last scoop.' },
  { name: 'Hiro T.', flavour: 'Pistachio', color: '#B9D58C', when: '5 days ago', text: 'Properly nutty, with a hint of salt that makes it addictive. The best pistachio I have found outside of Sicily.' },
  { name: 'Priya S.', flavour: 'Blueberry Lavender', color: '#A084D6', when: '2 months ago', text: 'Floral without being soapy, which is rare. Elegant, quiet and unbelievably good with a warm brownie.' },
  { name: 'Lucas B.', flavour: 'Mango Sunrise', color: '#F7B733', when: '1 week ago', text: 'Tastes like biting into a ripe mango on a warm day. Bright, fresh and the texture is spot on. Five stars all round.' },
  { name: 'Emma W.', flavour: 'Raspberry Cone', color: '#C2325A', when: '6 days ago', text: 'Tangy raspberry with the crunchiest waffle cone. Delivery was fast and everything arrived perfectly frozen.' },
  { name: 'Noah P.', flavour: 'Vanilla Bean', color: '#F4E2AE', when: '3 months ago', text: 'Our whole office orders from Little Scoop now. Consistent, generous scoops and the friendliest team. Highly recommended.' },
];

const Stars = ({ n = 5 }) => (
  <span className="stars" role="img" aria-label={`${n} out of 5 stars`}>
    {Array.from({ length: 5 }, (_, i) => <svg key={i} viewBox="0 0 24 24" className={i < n ? 'on' : ''}><path d="m12 2.5 2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6 6 20.9l1.3-6.7-5-4.7 6.8-.8z" /></svg>)}
  </span>
);

export default function Reviews() {
  const ref = useReveal(.12);
  const track = useRef(null);
  const [pos, setPos] = useState({ p: 0, start: true, end: false });
  const update = useCallback(() => {
    const el = track.current; if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setPos({ p: max > 0 ? el.scrollLeft / max : 0, start: el.scrollLeft < 8, end: el.scrollLeft > max - 8 });
  }, []);
  useEffect(() => { update(); addEventListener('resize', update); return () => removeEventListener('resize', update); }, [update]);
  const move = (dir) => {
    const el = track.current, card = el.querySelector('.review');
    el.scrollBy({ left: dir * (card.offsetWidth + 24), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  return (
    <section id="reviews" className="sec reviews" ref={ref}>
      <div className="sec-inner">
        <div className="rev-head">
          <div>
            <p className="kicker rv">Reviews</p>
            <h2 className="sec-title rv" style={{ '--d': '.08s' }}>Loved by <em>scoop</em> lovers.</h2>
          </div>
          <div className="rating rv" style={{ '--d': '.16s' }}>
            <b>4.9</b>
            <div><Stars /><span>Based on 2,480 happy reviews</span></div>
          </div>
        </div>
      </div>

      <div className="track-wrap rv" style={{ '--d': '.2s' }}>
        <div className="track" ref={track} onScroll={update} tabIndex={0} aria-label="Customer reviews">
          {REVIEWS.map((r) => (
            <article className="review" key={r.name + r.flavour}>
              <Stars />
              <p className="quote">“{r.text}”</p>
              <footer>
                <span className="avatar" style={{ background: `linear-gradient(135deg, ${r.color}, ${r.color}cc)`, color: ['#6B3A2A', '#C2325A', '#A084D6'].includes(r.color) ? '#fff' : 'var(--ink)' }}>{r.name[0]}</span>
                <div><strong>{r.name}</strong><small>Verified buyer · {r.flavour}</small></div>
                <time>{r.when}</time>
              </footer>
            </article>
          ))}
        </div>
      </div>

      <div className="sec-inner rev-controls rv" style={{ '--d': '.28s' }}>
        <div className="progress" aria-hidden="true"><i style={{ width: `${20 + pos.p * 80}%` }} /></div>
        <div className="arrows">
          <button onClick={() => move(-1)} disabled={pos.start} aria-label="Previous reviews"><svg viewBox="0 0 36 12"><path d="M36 6H1M6 1 1 6l5 5" /></svg></button>
          <button onClick={() => move(1)} disabled={pos.end} aria-label="Next reviews"><svg viewBox="0 0 36 12"><path d="M0 6h35M30 1l5 5-5 5" /></svg></button>
        </div>
      </div>
    </section>
  );
}
