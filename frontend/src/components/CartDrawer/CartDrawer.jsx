import BowlArt from '../../art/BowlArt.jsx';
import { sizes, toppings } from '../../data/flavours.js';
import { bowlImg } from '../../data/productImages.js';
import { useCart } from '../../context/CartContext.jsx';
import { placeStorefrontOrder } from '../../admin/store/persist.js';
import { useState, useEffect } from 'react';
import './CartDrawer.css';

const FREE_AT = 50;
const money = (n) => `$${n.toFixed(2)}`;

export default function CartDrawer({ open, onClose, onToast }) {
  const { lines, subtotal, setQty, remove, clear } = useCart();
  const [step, setStep] = useState('cart'), [f, setF] = useState({ name: '', email: '', phone: '', address: '' }), [err, setErr] = useState({}), [order, setOrder] = useState(null);
  useEffect(() => { if (!open) { const t = setTimeout(() => { setStep('cart'); setErr({}); }, 400); return () => clearTimeout(t); } return undefined; }, [open]);
  const place = (e) => {
    e.preventDefault(); const er = {};
    if (f.name.trim().length < 2) er.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email.';
    if (f.address.trim().length < 5) er.address = 'Enter a delivery address.';
    setErr(er); if (Object.keys(er).length) return;
    const o = placeStorefrontOrder({ lines, subtotal, customer: { name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() || '—', address: f.address.trim() } });
    clear(); setOrder(o); setStep('done');
  };
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr({ ...err, [k]: '' }); };
  const left = Math.max(0, FREE_AT - subtotal);
  return (
    <>
      <div className={`scrim ${open ? 'on' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`cart-drawer ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Your cart" aria-hidden={!open}>
        <button className="drawer-close" onClick={onClose} aria-label="Close cart" tabIndex={open ? 0 : -1}><i /><i /></button>
        <h2>{step === 'done' ? 'Thank you!' : step === 'checkout' ? 'Checkout' : 'Your scoops.'}</h2>
        {step === 'cart' && <>
          <div className="drawer-body">
            {lines.length === 0 && <p className="empty">Nothing in your cart yet. Pick a flavour from the rail.</p>}
            {lines.map((l) => (
              <div className="cart-row" key={l.key}>
                <div className="thumb">{bowlImg(l.flavour.id) ? <img src={bowlImg(l.flavour.id)} alt="" /> : <div style={{ width: 876, height: 1168, transform: 'scale(.075)', transformOrigin: '0 0' }}><BowlArt flavour={l.flavour} /></div>}</div>
                <div className="info">
                  <strong>{l.flavour.name}</strong>
                  <span>{sizes.find((s) => s.id === l.size)?.name}{l.toppings.length ? ` · ${l.toppings.map((t) => toppings.find((x) => x.id === t)?.name).join(', ')}` : ''}</span>
                  <div className="qty">
                    <button onClick={() => setQty(l.key, l.qty - 1)} aria-label="Fewer">−</button><b>{l.qty}</b><button onClick={() => setQty(l.key, l.qty + 1)} aria-label="More">+</button>
                    <button className="rm" onClick={() => remove(l.key)}>Remove</button>
                  </div>
                </div>
                <div className="price">{money(l.unit * l.qty)}</div>
              </div>
            ))}
          </div>
          <footer>
            <div className="sub"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            <div className="free"><i style={{ width: `${Math.min(100, (subtotal / FREE_AT) * 100)}%` }} /></div>
            <p>{lines.length === 0 ? `Free delivery on orders over $${FREE_AT}` : left > 0 ? `Add ${money(left)} more for free delivery` : 'You have free delivery.'}</p>
            <button className="checkout" disabled={lines.length === 0} onClick={() => setStep('checkout')}>Checkout</button>
          </footer>
        </>}
        {step === 'checkout' && (
          <form className="drawer-body co-form" onSubmit={place} noValidate>
            <p className="empty" style={{ margin: '4px 0 6px' }}>Delivery details for your {lines.reduce((n, l) => n + l.qty, 0)} scoops · {money(subtotal)}</p>
            {[['name', 'Full name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone (optional)', 'tel'], ['address', 'Delivery address', 'text']].map(([k, label, type]) => (
              <label key={k} className={err[k] ? 'bad' : ''}><span>{label}</span><input type={type} value={f[k]} onChange={set(k)} />{err[k] && <small>{err[k]}</small>}</label>
            ))}
            <div className="co-actions"><button type="button" className="back" onClick={() => setStep('cart')}>Back</button><button className="checkout" type="submit">Place order · {money(subtotal + (subtotal >= FREE_AT ? 0 : 3.5))}</button></div>
            <p className="note">Demo checkout: no payment is taken. The order appears in the admin panel.</p>
          </form>
        )}
        {step === 'done' && (
          <div className="drawer-body done">
            <div className="tick"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></div>
            <p>Your order <b>{order?.id}</b> is confirmed.</p><p className="empty">We are getting your scoops ready.</p>
            <button className="checkout" onClick={onClose}>Keep browsing</button>
            <a className="adm-link" href="#/admin/orders" onClick={() => onClose()}>View in admin panel</a>
          </div>
        )}
      </aside>
    </>
  );
}
