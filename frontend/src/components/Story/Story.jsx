import { useEffect, useRef, useState } from 'react';
import BowlArt from '../../art/BowlArt.jsx';
import { Garnish } from '../../art/Garnish.jsx';
import { flavours } from '../../data/flavours.js';
import { storyImg } from '../../data/productImages.js';
import { useReveal } from '../../hooks/useReveal.js';
import { goTo } from '../Header/Header.jsx';
import './Story.css';

function Stat({ to, suffix = '', label, delay }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (reduce) { setN(to); return; }
      const t0 = performance.now();
      const tick = (now) => { const k = Math.min(1, (now - t0) / 1400); setN(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }, { threshold: .6 });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <div className="stat rv" ref={ref} style={{ '--d': delay }}><b>{n}{suffix}</b><span>{label}</span></div>;
}

const VALUES = [
  { t: 'Real ingredients', d: 'Whole vanilla beans, ripe fruit and single-origin cocoa. Nothing artificial, ever.', i: <path d="M12 21c-5-3-8-6.5-8-11a5 5 0 0 1 8-3.5A5 5 0 0 1 20 10c0 4.5-3 8-8 11z" /> },
  { t: 'Small batches', d: 'We churn in tiny batches so every scoop is dense, creamy and full of flavour.', i: <><path d="M5 10h14l-1.5 9h-11z" /><path d="M8 10c0-3 1.5-5 4-5s4 2 4 5" /></> },
  { t: 'Made fresh daily', d: 'Churned each morning in our kitchen and scooped the same day, never frozen for weeks.', i: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></> },
];

export default function Story() {
  const ref = useReveal(.12);
  const photo = storyImg();
  const vanilla = flavours[0];
  return (
    <section id="story" className="sec story" ref={ref}>
      <div className="sec-inner story-grid">
        <div className="story-visual rv">
          <div className="arch">
            {photo ? <img src={photo} alt="Our kitchen" /> : (
              <>
                <i className="blob b1" /><i className="blob b2" />
                <div className="art-bowl"><BowlArt flavour={vanilla} peek /></div>
                <span className="g g1"><Garnish kind="vanillaFlower" /></span>
                <span className="g g2"><Garnish kind="strawberryHalf" /></span>
                <span className="g g3"><Garnish kind="vanillaPod" /></span>
              </>
            )}
          </div>
          <div className="badge-round" aria-hidden="true">
            <svg viewBox="0 0 120 120"><defs><path id="circ" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" /></defs>
              <text fontFamily="Inter,sans-serif" fontSize="10.5" fontWeight="600" letterSpacing="3.2" fill="currentColor"><textPath href="#circ" textLength="268" lengthAdjust="spacing">SMALL BATCH · SINCE 2012 · </textPath></text></svg>
            <b>12</b>
          </div>
        </div>

        <div className="story-copy">
          <p className="kicker rv">Our story</p>
          <h2 className="sec-title rv" style={{ '--d': '.08s' }}>Made slowly,<br /><em>scooped</em> with love.</h2>
          <p className="lead rv" style={{ '--d': '.16s' }}>It started in a tiny kitchen with a hand-cranked churn, a bag of Madagascar vanilla beans and one stubborn idea: ice cream should taste exactly like the thing it is named after.</p>
          <p className="lead rv" style={{ '--d': '.22s' }}>Twelve years on, we still make every batch by hand, with ripe fruit from local growers and cocoa we taste before we buy. No shortcuts, no artificial anything. Just a little scoop of something lovely.</p>
          <div className="stats">
            <Stat to={12} label="Years of scooping" delay=".28s" />
            <Stat to={100} suffix="%" label="Real ingredients" delay=".34s" />
            <Stat to={7} label="Signature flavours" delay=".4s" />
          </div>
          <div className="story-actions rv" style={{ '--d': '.46s' }}>
            <button className="btn" onClick={() => goTo('flavours')}>Explore flavours</button>
            <span className="sign">The Little Scoop family</span>
          </div>
        </div>
      </div>

      <div className="sec-inner values">
        {VALUES.map((v, i) => (
          <div className="value rv" key={v.t} style={{ '--d': `${.1 + i * .1}s` }}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{v.i}</svg>
            <h3>{v.t}</h3><p>{v.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
