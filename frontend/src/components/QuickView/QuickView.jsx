import { useEffect, useRef, useState } from 'react';
import PhotoArt from '../../art/PhotoArt.jsx';
import { Garnish } from '../../art/Garnish.jsx';
import { sizes, toppings, unitPrice } from '../../data/flavours.js';
import { peekImg, photoImgs } from '../../data/productImages.js';
import './QuickView.css';

const Icon = {
  truck: <svg viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5h16v13H2zM18 9h6l5 5v4H18z" /><circle cx="8" cy="19" r="2.4" /><circle cx="23" cy="19" r="2.4" /></svg>,
  shield: <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3 5 6.5v7c0 5.4 3.6 9.2 9 11.5 5.4-2.3 9-6.1 9-11.5v-7z" /><path d="m9.5 13.5 3.5 3.5 6-6.5" /></svg>,
  heart: <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M14 24C5 17 3 12.5 3 9.5A5.5 5.5 0 0 1 14 7a5.5 5.5 0 0 1 11 2.5C25 12.5 23 17 14 24z" /></svg>,
  cart: <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4h4l3 14h13l3-10H8" /><circle cx="11" cy="23" r="1.8" /><circle cx="21" cy="23" r="1.8" /></svg>,
};

export default function QuickView({ flavour, open, onClose, onAdd }) {
  const [size, setSize] = useState('regular');
  const [tops, setTops] = useState([]);
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(0);
  const [added, setAdded] = useState(false);
  const closeRef = useRef(null), panelRef = useRef(null), photoRef = useRef(null), last = useRef(null);

  // reset every time a flavour opens: Regular preselected
  useEffect(() => {
    panelRef.current?.toggleAttribute('inert', !open);
    if (!open) return undefined;
    setSize('regular'); setTops([]); setQty(1); setPhoto(0); setAdded(false);
    last.current = document.activeElement;
    const t = setTimeout(() => closeRef.current?.focus(), 60);
    return () => { clearTimeout(t); last.current?.focus?.(); };
  }, [open, flavour?.id]);

  useEffect(() => {
    if (!open) return undefined;
    const key = (e) => {
      if (e.key === 'ArrowLeft') setPhoto((p) => (p + 2) % 3);
      if (e.key === 'ArrowRight') setPhoto((p) => (p + 1) % 3);
      if (e.key === 'Tab' && panelRef.current) {
        const f = [...panelRef.current.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')]
          .filter((n) => !n.closest('[inert]') && n.getClientRects().length);
        if (!f.length) return;
        const first = f[0], end = f[f.length - 1];
        if (!panelRef.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus(); }
        else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open]);

  if (!flavour) return <div className="scrim" />;
  const unit = unitPrice(flavour, size, tops);
  const total = unit * qty;
  const real = photoImgs(flavour.id), main = peekImg(flavour.id);
  const imageOnFirstSlide = Boolean(real[0] || main);
  const add = () => {
    if (added) return;
    const r = photoRef.current.getBoundingClientRect();
    setAdded(true);
    setTimeout(() => onAdd({ flavourId: flavour.id, size, toppings: tops, qty }, { cx: r.left + r.width / 2, cy: r.top + r.height / 2 }), 380);
  };

  return (
    <>
      <div className={`scrim ${open ? 'on' : ''}`} onClick={onClose} aria-hidden="true" />
      <div className={`quick ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label={`${flavour.name} quick view`} aria-hidden={!open} ref={panelRef}>
        <section className="q-photo" ref={photoRef}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={`q-slide ${photo === i ? 'on' : ''}`}>
              {real[i] ? <img className="cover" src={real[i]} alt="" />
                : main && i === 0 ? <img className="contain" src={main} alt="" />
                : main && i === 1 ? <img className="zoom" src={main} alt="" />
                : <PhotoArt flavour={flavour} index={i} />}
              {i === 0 && imageOnFirstSlide && <div className="q-garnish" aria-hidden="true">
                {flavour.garnish.map(([kind, x, , size, rotation], index) => (
                  <span key={`${kind}-${index}`} style={{
                    left: `${Math.min(76, Math.max(4, (x / 876) * 100))}%`,
                    bottom: `${10 + index * 3}%`,
                    width: `${(size / 876) * 100}%`,
                    transform: `rotate(${rotation}deg)`,
                  }}>
                    <Garnish kind={kind} />
                  </span>
                ))}
              </div>}
            </div>
          ))}
          {flavour.popular && <span className="badge"><svg viewBox="0 0 24 24" width="17" height="17"><path d="m12 2.5 2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6 6 20.9l1.3-6.7-5-4.7 6.8-.8z" fill="#E8932B" /></svg>Popular</span>}
          <div className="q-nav">
            <button onClick={() => setPhoto((p) => (p + 2) % 3)} aria-label="Previous photo"><svg viewBox="0 0 20 20" width="16"><path d="m12 4-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></button>
            <div className="dots">{[0, 1, 2].map((i) => <button key={i} className={photo === i ? 'on' : ''} onClick={() => setPhoto(i)} aria-label={`Photo ${i + 1}`} />)}</div>
            <button onClick={() => setPhoto((p) => (p + 1) % 3)} aria-label="Next photo"><svg viewBox="0 0 20 20" width="16"><path d="m8 4 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></button>
          </div>
        </section>
        <section className="q-details">
          <button className="q-close" ref={closeRef} onClick={onClose} aria-label="Close"><i /><i /></button>
          <div className="q-body">
          <p className="eyebrow">{flavour.tag}<span /></p>
          <h2>{flavour.name}</h2>
          <p className="q-price">${unit.toFixed(2)}</p>
          <p className="q-desc">{flavour.description}</p>
          <hr />
          <h3>Select Size</h3>
          <div className="sizes">{sizes.map((s) => (
            <button key={s.id} className={size === s.id ? 'on' : ''} onClick={() => setSize(s.id)} aria-pressed={size === s.id}><b>{s.name}</b><small>({s.volume})</small></button>
          ))}</div>
          <h3>Add Toppings <span>(Optional)</span></h3>
          <div className="tops">{toppings.map((t) => {
            const on = tops.includes(t.id);
            return <button key={t.id} className={on ? 'on' : ''} role="checkbox" aria-checked={on} onClick={() => setTops(on ? tops.filter((x) => x !== t.id) : [...tops, t.id])}>
              <i>{on && <svg viewBox="0 0 12 12" width="10"><path d="m2 6.5 2.5 2.5L10 3.5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}</i>
              <span><b>{t.name}</b><small>+${t.price.toFixed(2)}</small></span></button>;
          })}</div>
          <div className="buy">
            <div className="stepper"><button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Fewer">−</button><span aria-live="polite">{qty}</span><button onClick={() => setQty(Math.min(10, qty + 1))} aria-label="More">+</button></div>
            <button className={`add ${added ? 'added' : ''}`} onClick={add}>{added ? 'Added ✓' : <>{Icon.cart}Add to Cart<em>${total.toFixed(2)}</em></>}</button>
          </div>
          </div>
          <footer>
            <div>{Icon.truck}<p><b>Free Delivery</b><small>On orders over $50</small></p></div>
            <div>{Icon.shield}<p><b>Secure Payment</b><small>Your information is safe</small></p></div>
            <div>{Icon.heart}<p><b>Made with Love</b><small>Always fresh</small></p></div>
          </footer>
        </section>
      </div>
    </>
  );
}
