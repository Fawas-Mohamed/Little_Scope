import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { heroFlavours } from '../../data/heroFlavours.js';
import { heroImg, garnishImgs } from '../../data/productImages.js';
import { useViewport } from '../../hooks/useViewport.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import HeroCup from '../../art/HeroCup.jsx';
import { Garnish } from '../../art/Garnish.jsx';
import { rng } from '../../art/colors.js';
import './Hero.css';

const N = heroFlavours.length;
const LAYERS = ['word', 'shadow', 'cup', 'fruit', 'corner'];
const FACTOR = { word: .4, shadow: .3, cup: .15, fruit: .55, corner: .75 };
const FRUIT = [
  { item: 2, x: 383, y: 178, w: 104, rot: 0 }, { item: 3, x: 960, y: 232, w: 118, rot: 0 }, { item: 1, x: 295, y: 478, w: 129, rot: -8 },
  { item: 1, x: 1247, y: 455, w: 123, rot: 15 }, { item: 2, x: 968, y: 590, w: 110, rot: 30 },
];
const CORNER = [{ item: 1, x: -15, y: 590, w: 255, rot: 0 }, { item: 3, x: 1282, y: 40, w: 200, rot: 0 }];
const SHADOWS = [[345, 650, 170, 24], [720, 708, 320, 30], [1318, 638, 160, 22], [1045, 760, 150, 22]];
// measured coverage curve of the panel wipe (t -> c), smoothstep between points
const COVER = [[0, 0], [.031, .006], [.134, .012], [.206, .023], [.278, .047], [.34, .07], [.412, .105], [.485, .158], [.546, .246], [.583, .55], [.62, .825], [.69, .9], [.79, .94], [.85, .956], [.93, .975], [1, 1]];
const cover = (t) => {
  if (t <= 0) return 0; if (t >= 1) return 1;
  const i = COVER.findIndex(([p]) => p >= t), [a, av] = COVER[i - 1], [b, bv] = COVER[i], k = (t - a) / (b - a);
  return av + (bv - av) * (3 * k * k - 2 * k * k * k);
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

let ctx;
const ink100 = (text) => {
  ctx ||= document.createElement('canvas').getContext('2d');
  ctx.font = '700 100px Poppins, sans-serif';
  const m = ctx.measureText(text);
  return m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
};
// Giant word sizing: 445 px by default; words that would overflow tighten to -0.035em and shrink so the ink fits the target width.
function wordLayout(text, mobileLimit) {
  const ink = ink100(text) / 100, n = text.length;
  const limit = mobileLimit ?? 1330, target = mobileLimit ?? 1400;
  if (445 * (ink + .005 * (n - 1)) <= limit) return { size: 445, ls: '.005em' };
  return { size: Math.min(445, target / (ink - .035 * (n - 1))), ls: '-.035em' };
}

function HeroSlide({ slide, u, vp, role, reg }) {
  const cup = heroImg(slide.id), garn = garnishImgs(slide.id);
  const word = wordLayout(slide.name, vp.mobile ? Math.min(1440, vp.w / u) * .92 : null);
  const baseline = 403.5 + (.698 * word.size) / 2, top = baseline - .85 * word.size;
  const bob = useMemo(() => { const r = rng(slide.name.charCodeAt(0) * 17 + slide.name.length); return Array.from({ length: 7 }, () => ({ d: 3.2 + r() * 1.8, l: -r() * 4 })); }, [slide.name]);
  const piece = (p, key, layer, bi) => (
    <span key={key} className={`hero-piece ${layer === 'corner' ? 'blurred' : ''}`} style={{ left: p.x * u, top: p.y * u, width: p.w * u, height: p.w * u, '--r': `${p.rot}deg`, '--bd': `${bob[bi].d}s`, '--bl': `${bob[bi].l}s` }}>
      <div>
        {garn[p.item - 1] ? <img src={garn[p.item - 1]} alt="" draggable="false" /> : <Garnish kind={slide.garnish[p.item - 1]} />}
      </div>
    </span>
  );
  return (
    <section ref={(n) => reg.slide(slide.id, n)} className="hero-slide" style={{ background: slide.color, zIndex: role === 'out' ? 2 : 1 }} aria-hidden={role === 'in'}>
      <div className="hero-frame" style={{ width: 1440 * u, height: 900 * u, '--u': `${u}px` }}>
        <div className="hero-layer" ref={(n) => reg.layer(slide.id, 'word', n)}>
          <h1 className="hero-word" style={{ top: top * u, fontSize: word.size * u, letterSpacing: word.ls }}>{slide.name}</h1>
        </div>
        <div className="hero-layer" ref={(n) => reg.layer(slide.id, 'shadow', n)}>
          {SHADOWS.map(([cx, cy, w, h], i) => <i key={i} className="floor-shadow" style={{ left: (cx - w / 2) * u, top: (cy - h / 2) * u, width: w * u, height: h * u }} />)}
        </div>
        <div className="hero-layer" ref={(n) => reg.layer(slide.id, 'cup', n)}>
          <div className="hero-cup" style={{ left: slide.cup.x * u, top: slide.cup.y * u, width: slide.cup.w * u, height: slide.cup.h * u }}>
            {cup ? <img className="hero-img" src={cup} alt={`${slide.name} ice cream`} draggable="false" /> : <HeroCup scoop={slide.scoop} band={slide.band} name={slide.name} />}
          </div>
        </div>
        <div className="hero-layer" ref={(n) => reg.layer(slide.id, 'fruit', n)}>{FRUIT.map((p, i) => piece(p, i, 'fruit', i))}</div>
        <div className="hero-layer" ref={(n) => reg.layer(slide.id, 'corner', n)}>{CORNER.map((p, i) => piece(p, i, 'corner', 5 + i))}</div>
      </div>
    </section>
  );
}

const Hero = forwardRef(function Hero({ onOrder }, ref) {
  const vp = useViewport();
  const reduced = useReducedMotion();
  const u = vp.mobile ? Math.max(.1, Math.min(vp.w / 640, (vp.h - 200) / 620)) : Math.min(vp.w / 1440, vp.h / 900);
  const [active, setActive] = useState(0);
  const [trans, setTrans] = useState(null);
  const [, setFontsReady] = useState(false);
  const root = useRef(null), slideNodes = useRef({}), layerNodes = useRef({});
  const busy = useRef(false), paused = useRef(0), inView = useRef(true), start = useRef(null), intro = useRef([]);
  const activeRef = useRef(0), reducedRef = useRef(reduced), uRef = useRef(u), goRef = useRef(() => {});
  reducedRef.current = reduced; uRef.current = u;
  const reg = useMemo(() => ({ slide: (id, n) => { slideNodes.current[id] = n; }, layer: (id, l, n) => { (layerNodes.current[id] ||= {})[l] = n; } }), []);

  const go = useCallback((dir, target, user = true) => {
    if (busy.current) return;
    if (user) paused.current = Date.now() + 6000;
    const from = activeRef.current;
    const to = target == null ? (from + dir + N) % N : target;
    if (to === from) return;
    const d = target == null ? dir : to > from ? 1 : -1;
    intro.current.forEach((a) => a.cancel()); intro.current = [];
    if (reducedRef.current) { activeRef.current = to; setActive(to); return; }
    busy.current = true;
    setTrans({ from, to, dir: d });
  }, []);
  goRef.current = go;
  useImperativeHandle(ref, () => ({ go: (i) => go(0, i) }), [go]);

  // the wipe: old slide is covered from its right edge (or left when going back) while content drifts, new content parallaxes in
  useLayoutEffect(() => {
    if (!trans) return undefined;
    const { from, to, dir } = trans;
    const width = 1440 * uRef.current, old = slideNodes.current[heroFlavours[from].id], t0 = performance.now();
    const apply = (t) => {
      const c = cover(t);
      if (old) old.style.clipPath = dir > 0 ? `inset(0 ${c * 100}% 0 0)` : `inset(0 0 0 ${c * 100}%)`;
      const k = clamp((t - .5) / .42, 0, 1), e = 1 - (1 - k) * (1 - k);
      for (const L of LAYERS) {
        const a = layerNodes.current[heroFlavours[from].id]?.[L], b = layerNodes.current[heroFlavours[to].id]?.[L];
        if (a) a.style.transform = `translateX(${-dir * c * .14 * width}px)`;
        if (b) b.style.transform = `translateX(${dir * (1 - e) * FACTOR[L] * width}px)`;
      }
    };
    apply(0);
    let raf;
    const tick = (now) => {
      const t = (now - t0) / 970;
      if (t < 1) { apply(t); raf = requestAnimationFrame(tick); return; }
      for (const f of [from, to]) {
        const id = heroFlavours[f].id;
        LAYERS.forEach((L) => { const n = layerNodes.current[id]?.[L]; if (n) n.style.transform = ''; });
        if (slideNodes.current[id]) slideNodes.current[id].style.clipPath = '';
      }
      activeRef.current = to; setActive(to); setTrans(null); busy.current = false;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [trans]);

  // opening sequence: first slide's layers glide in from the right
  useLayoutEffect(() => {
    if (reducedRef.current) return;
    LAYERS.forEach((L) => { const n = layerNodes.current[heroFlavours[0].id]?.[L]; if (n) n.style.transform = `translateX(${FACTOR[L] * 1440 * uRef.current}px)`; });
  }, []);
  useEffect(() => {
    let ran = false;
    const run = () => {
      if (ran) return; ran = true;
      if (reducedRef.current) return;
      LAYERS.forEach((L) => {
        const n = layerNodes.current[heroFlavours[0].id]?.[L];
        if (!n || busy.current) return;
        const a = n.animate([{ transform: `translateX(${FACTOR[L] * 1440 * uRef.current}px)` }, { transform: 'translateX(0px)' }], { duration: 900, easing: 'cubic-bezier(.22,.8,.3,1)', fill: 'both' });
        a.onfinish = () => { n.style.transform = ''; a.cancel(); };
        intro.current.push(a);
      });
    };
    const fail = setTimeout(run, 3000);
    (document.fonts?.ready ?? Promise.resolve()).then(() => { setFontsReady(true); run(); });
    return () => clearTimeout(fail);
  }, []);

  // autoplay, visibility, keyboard, swipe
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { inView.current = e.isIntersecting; }, { threshold: .15 });
    io.observe(root.current);
    const timer = setInterval(() => { if (!document.hidden && inView.current && !busy.current && Date.now() > paused.current) goRef.current(1, undefined, false); }, 2600);
    const key = (e) => { if (!inView.current || document.body.classList.contains('dim')) return; if (e.key === 'ArrowRight') goRef.current(1); if (e.key === 'ArrowLeft') goRef.current(-1); };
    const up = (e) => {
      if (!start.current) return;
      const dx = e.clientX - start.current.x, dy = e.clientY - start.current.y; start.current = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) goRef.current(dx < 0 ? 1 : -1);
    };
    window.addEventListener('keydown', key); window.addEventListener('pointerup', up);
    return () => { io.disconnect(); clearInterval(timer); window.removeEventListener('keydown', key); window.removeEventListener('pointerup', up); };
  }, []);

  const shown = trans ? [trans.from, trans.to] : [active];
  return (
    <section id="top" ref={root} className={`hero ${vp.mobile ? 'mobile' : ''}`} onPointerDown={(e) => { start.current = { x: e.clientX, y: e.clientY }; }}>
      {shown.map((i) => <HeroSlide key={heroFlavours[i].id} slide={heroFlavours[i]} u={u} vp={vp} reg={reg} role={trans ? (i === trans.from ? 'out' : 'in') : ''} />)}
      <button className="hero-arrow prev rise" style={{ animationDelay: '490ms' }} aria-label="Previous flavour" onClick={() => go(-1)}><svg viewBox="0 0 28 28"><path d="M24 14H4M12 6l-8 8 8 8" /></svg></button>
      <div className="hero-dots rise" style={{ animationDelay: '530ms' }} role="tablist" aria-label="Hero flavours">
        {heroFlavours.map((f, i) => <button key={f.id} role="tab" aria-selected={(trans ? trans.to : active) === i} aria-label={f.name} className={(trans ? trans.to : active) === i ? 'on' : ''} onClick={() => go(0, i)}><span>{f.name}</span></button>)}
      </div>
      <button className="hero-order rise" style={{ animationDelay: '570ms' }} onClick={onOrder}>ORDER NOW</button>
      <button className="hero-arrow next rise" style={{ animationDelay: '650ms' }} aria-label="Next flavour" onClick={() => go(1)}><svg viewBox="0 0 28 28"><path d="M4 14h20M16 6l8 8-8 8" /></svg></button>
    </section>
  );
});
export default Hero;
