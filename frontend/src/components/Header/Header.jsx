import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext.jsx';
import './Header.css';

export const NAV_LINKS = [['top', 'Home'], ['story', 'Our Story'], ['flavours', 'Flavours'], ['reviews', 'Reviews'], ['instagram', 'Instagram']];

export function goTo(id) {
  if (id === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
  else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Header({ active, overHero, onCart }) {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && setOpen(false);
    const r = () => innerWidth > 820 && setOpen(false);
    addEventListener('keydown', k); addEventListener('resize', r);
    return () => { removeEventListener('keydown', k); removeEventListener('resize', r); };
  }, []);
  const go = (id) => (e) => { e.preventDefault(); setOpen(false); goTo(id); };

  return (
    <header className={`site-nav ${overHero && !open ? 'on-hero' : 'on-light'} ${!overHero || open ? 'solid' : ''} ${open ? 'menu-open' : ''}`}>
      <div className="nav-row">
        <a className="logo rise" style={{ animationDelay: '250ms' }} href="#top" onClick={go('top')} aria-label="Little Scoop, home">Little Scoop</a>
        <nav className="main-nav rise" style={{ animationDelay: '330ms' }} aria-label="Main">
          {NAV_LINKS.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={go(id)} aria-current={active === id ? 'true' : undefined}>{label}</a>
          ))}
        </nav>
        <div className="nav-actions rise" style={{ animationDelay: '410ms' }}>
          <button className="cart-btn" onClick={onCart} data-fly-target>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2.5l2.2 10.5h9.6L20 7H6.5" /><circle cx="9" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /></svg>
            <span>Cart</span><b>{count}</b>
          </button>
          <button className="burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}><i /><i /><i /></button>
        </div>
      </div>
      <div className={`mobile-menu ${open ? 'open' : ''}`} aria-hidden={!open}>
        {NAV_LINKS.map(([id, label]) => <a key={id} href={`#${id}`} tabIndex={open ? 0 : -1} onClick={go(id)} aria-current={active === id ? 'true' : undefined}>{label}</a>)}
        <button className="menu-cta" tabIndex={open ? 0 : -1} onClick={() => { setOpen(false); goTo('flavours'); }}>Order now</button>
      </div>
    </header>
  );
}
