import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flavours } from '../../data/flavours.js';
import { bowlImg, peekImg, roomImg, bagImg } from '../../data/productImages.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { useCart } from '../../context/CartContext.jsx';
import BowlArt from '../../art/BowlArt.jsx';
import ShowcaseProduct from '../../art/ShowcaseProduct.jsx';
import RoomArt from '../../art/RoomArt.jsx';
import BagArt from '../../art/BagArt.jsx';
import './Showcase.css';

const N = flavours.length;
const K = .54;                                   // sprite px -> stage px at slot scale 1
const SLOT_X = [305, 517, 641, 758, 848, 921, 990];
const SLOT_S = [1, .72, .62, .55, .49, .43, .38];
const lerpTable = (xs, ys, v) => {
  if (v <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) if (v <= xs[i]) return ys[i - 1] + ((ys[i] - ys[i - 1]) * (v - xs[i - 1])) / (xs[i] - xs[i - 1]);
  return ys[ys.length - 1];
};
const slotX = (s) => (s <= 0 ? 305 + s * 120 : s >= 6 ? 990 + (s - 6) * 60 : lerpTable([0, 1, 2, 3, 4, 5, 6], SLOT_X, s));
const scaleAt = (x) => lerpTable(SLOT_X, SLOT_S, x);
const yAt = (x) => 720 - .55 * (x - 305);        // the rail: a straight diagonal line
const pad = (n) => String(n + 1).padStart(2, '0');
const money = (n) => `$${n.toFixed(2)}`;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const slotAt = (i, pos) => {
  const raw = i - pos;
  return raw < 0 && raw >= -1.3 ? raw : ((raw % N) + N) % N;
};
const opacityAt = (slot, reduced) => {
  if (reduced) return 1;
  if (slot < 0) return clamp((slot + 1.3) / 1.1, 0, 1);
  if (slot >= 5.6 && slot <= 6) return clamp((6 - slot) / .4, 0, 1);
  return 1;
};

function Plate({ room, mirror, side }) {
  return (
    <div className="plate" style={mirror ? { left: side * 1440, transform: 'scaleX(-1)' } : undefined}>
      {room ? <img src={room} alt="" draggable="false" /> : <RoomArt />}
    </div>
  );
}

export default function Showcase({ quickOpen, onOpen }) {
  const reduced = useReducedMotion();
  const { count } = useCart();
  const secRef = useRef(null), stageRef = useRef(null), titleRef = useRef(null), bagRef = useRef(null);
  const bowlNodes = useRef([]), indexFillRef = useRef(null), infoRef = useRef(null), pagerCountRef = useRef(null);
  const layoutRef = useRef({ trackTop: 0, step: 1, viewport: 0, width: 0 });
  const posRef = useRef(0), pinnedRef = useRef(false), displayRef = useRef(0), hoverRef = useRef(null);
  const progressFrame = useRef(0), updateProgressRef = useRef(() => {}), swapTimer = useRef(0), bagTimer = useRef(0);
  const lastWindowSize = useRef({ width: window.innerWidth, height: window.innerHeight });
  const [box, setBox] = useState({ W: 1440, H: 900 });
  const [disp, setDisp] = useState(0), [hover, setHover] = useState(null);
  const [entered, setEntered] = useState(false), [fontsReady, setFontsReady] = useState(false), [fs, setFs] = useState(68);
  const [qvAnim, setQvAnim] = useState(false), [intro, setIntro] = useState(false);
  const reducedRef = useRef(reduced), quickRef = useRef(quickOpen);
  reducedRef.current = reduced; quickRef.current = quickOpen;
  hoverRef.current = hover;

  const room = roomImg(), bag = bagImg();
  const compact = box.W <= 820 || box.H > box.W || box.H <= 500;

  // Measure outside the scroll path; progress frames only use these cached dimensions.
  useLayoutEffect(() => {
    const section = secRef.current, track = section?.parentElement, main = section?.closest('main');
    const measure = () => {
      if (!track || !section) return;
      const top = track.getBoundingClientRect().top + window.scrollY;
      const height = section.clientHeight;
      const step = (track.getBoundingClientRect().height - height) / (N - 1);
      const width = section.clientWidth;
      layoutRef.current = { trackTop: top, step, viewport: height, width };
      setBox((previous) => previous.W === width && previous.H === height ? previous : { W: width, H: height });
      updateProgressRef.current();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track); observer.observe(section);
    if (main) observer.observe(main);
    const onResize = () => {
      const next = { width: window.innerWidth, height: window.innerHeight };
      const previous = lastWindowSize.current;
      lastWindowSize.current = next;
      if (next.width === previous.width && Math.abs(next.height - previous.height) < 120) return;
      measure();
    };
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);
  useEffect(() => { document.fonts?.ready?.then(() => setFontsReady(true)); }, []);

  // The compact composition uses half of the stable sticky viewport for the stage.
  let S, ox, oy;
  if (compact) {
    const stageH = box.H * .5;
    S = stageH / 700;
    ox = -90 * S + Math.max(0, (box.W - 760 * S) / 2);
    oy = -150 * S;
  } else {
    S = Math.min(box.W / 1440, box.H / 900);
    ox = (box.W - 1440 * S) / 2; oy = (box.H - 900 * S) * .4;
  }

  // Entrance remains a one-time event even when the pinned section is revisited.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.intersectionRatio >= .35) setEntered(true); }, { threshold: [0, .15, .35, .6] });
    io.observe(secRef.current);
    const fail = setTimeout(() => setEntered(true), 4000);
    return () => { io.disconnect(); clearTimeout(fail); };
  }, []);

  // the entrance animations only run during the first seconds after the section appears
  useEffect(() => { if (!entered) return undefined; setIntro(true); const t = setTimeout(() => setIntro(false), 2800); return () => clearTimeout(t); }, [entered]);

  // slow, soft transition while Quick View opens / closes
  const firstQv = useRef(true);
  useEffect(() => { if (firstQv.current) { firstQv.current = false; return undefined; } setQvAnim(true); const t = setTimeout(() => setQvAnim(false), 780); return () => clearTimeout(t); }, [quickOpen]);

  // Title fit: a line wider than 300 px shrinks the whole title (min 36 px).
  useLayoutEffect(() => {
    const el = titleRef.current; if (!el) return;
    if (compact) { setFs(30); return; }
    el.style.fontSize = '68px';
    const w = Math.max(...[...el.querySelectorAll('.ln')].map((c) => c.offsetWidth));
    setFs(w > 300 ? Math.max(36, (68 * 300) / w) : 68);
  }, [disp, fontsReady, compact]);

  const place = (i, pos = posRef.current, withHover = true) => {
    const slot = slotAt(i, pos);
    let x = slotX(slot);
    const s = scaleAt(x), y = yAt(x);
    let dx = 0, dy = 0, rot = 0, k = 1;
    if (withHover && hover != null && !quickOpen && pinnedRef.current) {
      const hs = slotAt(hover, pos);
      if (i === hover) { if (slot > .5) { dx = 22 * s; dy = -14; rot = -2.5; k = 1.035; } else k = 1.02; }
      else if (hs > 0 && slot > hs) dx = 18 * s;
    }
    return { slot, x, y, s, dx, dy, rot, k, opacity: opacityAt(slot, reducedRef.current), z: 100 - Math.floor(slot) };
  };

  const scrollToProduct = useCallback((index) => {
    const target = clamp(index, 0, N - 1);
    if (Math.abs(target - posRef.current) < .001) return;
    const { trackTop, step } = layoutRef.current;
    window.scrollTo({ top: trackTop + target * step, behavior: 'smooth' });
  }, []);
  const moveBy = useCallback((delta) => {
    const target = displayRef.current + delta;
    if (target < 0 || target >= N) return;
    scrollToProduct(target);
  }, [scrollToProduct]);
  const swapText = (index) => {
    if (index === displayRef.current) return;
    displayRef.current = index;
    if (reducedRef.current) {
      infoRef.current?.classList.remove('swap');
      pagerCountRef.current?.classList.remove('swap');
      setDisp(index);
      return;
    }
    infoRef.current?.classList.add('swap');
    pagerCountRef.current?.classList.add('swap');
    clearTimeout(swapTimer.current);
    setDisp(index);
    swapTimer.current = setTimeout(() => {
      infoRef.current?.classList.remove('swap');
      pagerCountRef.current?.classList.remove('swap');
    }, 140);
  };
  const updateProgress = () => {
    const { trackTop, step } = layoutRef.current;
    if (!step) return;
    const raw = clamp((window.scrollY - trackTop) / step, 0, N - 1);
    const pos = reducedRef.current ? Math.floor(raw + .5 + .5 / step) : raw;
    const index = clamp(Math.floor(pos + .5 + .5 / step), 0, N - 1);
    const pinned = window.scrollY >= trackTop - .5 && window.scrollY <= trackTop + (N - 1) * step;
    const wasPinned = pinnedRef.current;
    posRef.current = pos;
    pinnedRef.current = pinned;
    if (pinned !== wasPinned) {
      const active = pinned ? 'flavours' : window.scrollY < trackTop ? 'story' : 'reviews';
      window.dispatchEvent(new CustomEvent('showcasepinchange', { detail: active }));
    }
    if (hoverRef.current != null && (!pinned || Math.abs(pos - Math.round(pos)) >= .08 || quickRef.current)) {
      hoverRef.current = null;
      setHover(null);
    }
    if (indexFillRef.current) indexFillRef.current.style.transform = `scaleY(${(pos + 1) / N})`;
    for (let i = 0; i < N; i++) {
      const node = bowlNodes.current[i];
      if (!node) continue;
      const p = place(i, pos);
      node.style.transform = `translate3d(${p.x + p.dx}px,${p.y + p.dy}px,0) rotate(${p.rot}deg) scale(${K * p.s * p.k})`;
      const opacity = String(p.opacity), zIndex = String(p.z);
      if (node.style.opacity !== opacity) node.style.opacity = opacity;
      if (node.style.zIndex !== zIndex) node.style.zIndex = zIndex;
    }
    swapText(index);
  };
  updateProgressRef.current = updateProgress;
  useEffect(() => {
    const onScroll = () => {
      if (progressFrame.current) return;
      progressFrame.current = requestAnimationFrame(() => {
        progressFrame.current = 0;
        updateProgressRef.current();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    updateProgressRef.current();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (progressFrame.current) cancelAnimationFrame(progressFrame.current);
      clearTimeout(swapTimer.current);
      clearTimeout(bagTimer.current);
    };
  }, []);

  const interactionEnabled = () => pinnedRef.current && Math.abs(posRef.current - Math.round(posRef.current)) < .08 && !quickRef.current;
  const toStage = (e) => { const r = stageRef.current.getBoundingClientRect(), s = r.width / 1440; return [(e.clientX - r.left) / s, (e.clientY - r.top) / s]; };
  const hit = (px, py) => {
    const spans = flavours.map((_, i) => { const p = place(i, posRef.current, false); return { i, slot: p.slot, l: p.x - 350 * K * p.s, r: p.x + 350 * K * p.s, t: p.y - 1040 * K * p.s, b: p.y + 30 * K * p.s }; }).filter((q) => q.slot >= 0 && q.slot <= 6).sort((a, b) => a.slot - b.slot);
    const f = spans[0]; if (!f) return null;
    if (px >= f.l + 30 && px <= f.r - 20 && py >= f.t + 60 && py <= f.b) return f.i;
    for (let k = 1; k < spans.length; k++) {
      const q = spans[k];
      if (q.r - 6 >= px) return py >= q.t + 40 && py <= q.b - 10 && px > f.r - 20 ? q.i : null;
    }
    return null;
  };
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!interactionEnabled()) { if (hoverRef.current != null) setHover(null); return; }
    const [px, py] = toStage(e), h = e.target.closest?.('button,a') ? null : hit(px, py);
    setHover((prev) => (prev === h ? prev : h));
  };
  const onClick = (e) => {
    if (e.target.closest('button,a') || !interactionEnabled()) return;
    const [px, py] = toStage(e), h = hit(px, py);
    if (h == null) return;
    setHover(null);
    if (h === Math.round(posRef.current)) onOpen(flavours[h]);
    else scrollToProduct(h);
  };
  useEffect(() => {
    const key = (e) => {
      if (!pinnedRef.current || quickRef.current || document.body.classList.contains('dim')) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.target.closest?.('input,textarea,select,[contenteditable="true"]')) return;
      e.preventDefault();
      moveBy(e.key === 'ArrowRight' ? 1 : -1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [moveBy]);

  // bag dips and settles, its badge pops when something lands
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) {
      bagRef.current?.animate([{ transform: 'none' }, { transform: 'translateY(4px) scale(1.05,.95)', offset: .35 }, { transform: 'translateY(-2px) scale(.98,1.02)', offset: .7 }, { transform: 'none' }], { duration: 420, easing: 'ease-out' });
      bagRef.current?.querySelector('.bag-count')?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 380 });
      document.querySelector('.cart-btn')?.classList.add('pop');
      clearTimeout(bagTimer.current);
      bagTimer.current = setTimeout(() => document.querySelector('.cart-btn')?.classList.remove('pop'), 420);
    }
    prevCount.current = count;
  }, [count]);

  const f = flavours[disp], hf = hover != null ? flavours[hover] : null;
  const touchHint = typeof matchMedia === 'function' && matchMedia('(hover: none)').matches;

  const info = (
    <div className="info" ref={infoRef} aria-live="polite">
      <div className="mask"><span className="count line" style={{ '--i': 0 }}>{pad(disp)} / 0{N}</span></div>
      <h2 ref={titleRef} style={compact ? undefined : { fontSize: fs }}>{f.title.map((t, i) => <div className="mask" key={t}><span className="ln line" style={{ '--i': i + 1 }}>{t}</span></div>)}</h2>
      <i className="rule fade" style={{ '--i': 0 }} />
      <div className="mask"><p className="tagline line" style={{ '--i': 3 }}>{f.tagline}</p></div>
      <div className="mask"><button className="explore line" style={{ '--i': 4 }} onClick={() => onOpen(f)}>EXPLORE FLAVOUR<svg viewBox="0 0 10 10" width="10" height="10"><path d="M1.5 8.5 8.5 1.5M3 1.5h5.5V7" fill="none" stroke="currentColor" strokeWidth="1" /></svg></button></div>
    </div>
  );
  const pager = (
    <nav className="pager fade" style={{ '--i': 1 }} aria-label="Browse flavours">
      <button onClick={() => moveBy(-1)} aria-label="Previous flavour"><svg viewBox="0 0 36 12" width="36" height="12"><path d="M36 6H1M6 1 1 6l5 5" fill="none" stroke="currentColor" strokeWidth="1" /></svg></button>
      <span ref={pagerCountRef}>{pad(disp)} — 0{N}</span>
      <button onClick={() => moveBy(1)} aria-label="Next flavour"><svg viewBox="0 0 36 12" width="36" height="12"><path d="M0 6h35M30 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1" /></svg></button>
    </nav>
  );
  const caption = (
    <div className="caption fade" style={{ '--i': 4 }} aria-live="polite">
      <strong>{hf ? `${hf.name} · ${money(hf.price)}` : 'Find your flavour.'}</strong>
      <span>{hf ? `${hf.tag} / 3 sizes` : touchHint ? 'Tap to browse. Tap again to peek.' : 'Hover to browse. Click to peek.'}</span>
    </div>
  );

  const stageStyle = { left: ox, top: oy, transform: `scale(${S})` };
  const hp = hover != null ? place(hover, posRef.current, false) : null;
  return (
    <>
    <div className="showcase-pin-marker showcase-pin-start" aria-hidden="true" />
    <section ref={secRef} className={`showcase ${compact ? 'mobile' : ''} ${entered ? 'entered' : ''} ${intro ? 'intro' : ''} ${quickOpen ? 'is-quick' : ''} ${qvAnim ? 'qv-anim' : ''}`}>
    <div className="stage-area" role="region" aria-label="Interactive flavour showcase. Use arrow keys to browse." onPointerMove={onMove} onPointerLeave={() => { hoverRef.current = null; setHover(null); }} onPointerUp={onClick}>
        <div className="stage" ref={stageRef} style={stageStyle}>
          <div className="plates anim">
            {!compact && <Plate room={room} mirror side={-1} />}
            <Plate room={room} />
            {!compact && <Plate room={room} mirror side={1} />}
          </div>

          <div className="bowls" style={{ cursor: hover != null ? 'pointer' : 'default' }}>
            {flavours.map((fl, i) => {
              const p = place(i, posRef.current), rest = bowlImg(fl.id), peekSrc = peekImg(fl.id);
              return (
                <div key={fl.id} ref={(node) => { bowlNodes.current[i] = node; }} className={`bowl anim ${hover === i ? 'on' : ''}`}
                  style={{ transform: `translate3d(${p.x + p.dx}px,${p.y + p.dy}px,0) rotate(${p.rot}deg) scale(${K * p.s * p.k})`, opacity: p.opacity, zIndex: p.z, '--slot': Math.max(0, p.slot) }}>
                  <div className="bowl-art">
                    <div className={`art rest ${rest ? 'photo-art' : ''}`}>{rest ? <ShowcaseProduct src={rest} flavour={fl} side={i === disp ? 'left' : 'right'} /> : <BowlArt flavour={fl} />}</div>
                    <div className={`art peek ${peekSrc ? 'photo-art' : ''}`}>{peekSrc ? <ShowcaseProduct src={peekSrc} flavour={fl} peek side={i === disp ? 'left' : 'right'} /> : <BowlArt flavour={fl} peek />}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {hp && hover != null && !quickOpen && <span className="sticker" style={{ left: hp.x + hp.dx, top: hp.y + hp.dy - 1040 * K * hp.s * .35, zIndex: 150 }}>Peek at this scoop</span>}

          {!compact && <>
            <div className="ui-info">{info}</div>
            <div className="ui-pager">{pager}</div>
            <div className="index fade" style={{ '--i': 0 }}><span>{pad(disp)}</span><i><b ref={indexFillRef} style={{ transform: `scaleY(${(posRef.current + 1) / N})` }} /></i><span>0{N}</span></div>
            <div className="stage-foot fade" style={{ '--i': 3 }}>LITTLE SCOOP · FLAVOURS | 0{N}</div>
            <div className="hint fade" style={{ '--i': 5 }}>SCROLL TO BROWSE<svg viewBox="0 0 20 10" width="20" height="10"><path d="M1 5h18M4 2 1 5l3 3M16 2l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1" /></svg>CLICK TO PEEK OR FOLLOW</div>
            <div className="ui-caption">{caption}</div>
            <button className="bag fade" ref={bagRef} style={{ '--i': 6 }} onClick={() => window.dispatchEvent(new Event('open-cart'))} aria-label={`Open cart, ${count} items`}>
              <span className="bag-art">{bag ? <img src={bag} alt="" /> : <BagArt />}</span>
              <span className="bag-mouth" data-fly-target />
              <span className="bag-count">{count}</span>
            </button>
          </>}
        </div>

        {/* keyboard access: one hidden button per flavour in rail order */}
        <div className="sr-only">
          {flavours.map((fl, i) => (
            <button key={fl.id} onFocus={() => { if (interactionEnabled()) setHover(i); }} onBlur={() => { hoverRef.current = null; setHover(null); }} onClick={() => scrollToProduct(i)}>Show {fl.name}</button>
          ))}
        </div>
        {hover != null && !quickOpen && <span className="sr-only" aria-live="polite">{flavours[hover].name}</span>}
      </div>

      {compact && (
        <div className="m-info">
          <div className="ui-info">{info}</div>
          {pager}
          {caption}
        </div>
      )}
    </section>
    <div className="showcase-pin-marker showcase-pin-end" aria-hidden="true" />
    </>
  );
}
