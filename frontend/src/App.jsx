import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header/Header.jsx';
import Story from './components/Story/Story.jsx';
import Reviews from './components/Reviews/Reviews.jsx';
import Instagram from './components/Instagram/Instagram.jsx';
import Footer from './components/Footer/Footer.jsx';
import { useScrollSpy } from './hooks/useScrollSpy.js';
import Hero from './components/Hero/Hero.jsx';
import Showcase from './components/Showcase/Showcase.jsx';
import QuickView from './components/QuickView/QuickView.jsx';
import CartDrawer from './components/CartDrawer/CartDrawer.jsx';
import Toast from './components/Toast/Toast.jsx';
import Flights from './components/Flights/Flights.jsx';
import { flavours } from './data/flavours.js';
import { useCart } from './context/CartContext.jsx';

export default function App() {
  const { add } = useCart();
  const [overHero, setOverHero] = useState(true);
  const active = useScrollSpy(['top', 'story', 'flavours', 'reviews', 'instagram', 'contact']);
  const [qv, setQv] = useState({ open: false, flavour: null });
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [flights, setFlights] = useState([]);
  const toastTimer = useRef(0);

  const tell = useCallback((m) => { setToast(m); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 2600); }, []);
  const toShowcase = () => document.getElementById('flavours')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // nav turns cocoa once the showcase is at least half in view
  useEffect(() => {
    const on = () => setOverHero(window.scrollY < window.innerHeight * .55);
    on(); window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, []);
  useEffect(() => { const open = () => setCartOpen(true); window.addEventListener('open-cart', open); return () => window.removeEventListener('open-cart', open); }, []);
  useEffect(() => {
    document.body.classList.toggle('dim', qv.open || cartOpen);
    return () => document.body.classList.remove('dim');
  }, [qv.open, cartOpen]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => {
    if (!qv.open && !cartOpen) return undefined;
    const root = document.documentElement, body = document.body;
    const scrollY = window.scrollY;
    const previous = { overflow: root.style.overflow, paddingRight: body.style.paddingRight, scrollBehavior: root.style.scrollBehavior };
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    root.style.overflow = 'hidden';
    root.style.scrollBehavior = 'auto';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      root.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
      window.scrollTo(0, scrollY);
      root.style.scrollBehavior = previous.scrollBehavior;
    };
  }, [qv.open, cartOpen]);
  // Esc closes the top layer: cart first, then Quick View
  useEffect(() => {
    const key = (e) => { if (e.key !== 'Escape') return; if (cartOpen) setCartOpen(false); else if (qv.open) setQv((s) => ({ ...s, open: false })); };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [cartOpen, qv.open]);

  const openQuick = useCallback((flavour) => setQv({ open: true, flavour }), []);
  const closeQuick = useCallback(() => setQv((s) => ({ ...s, open: false })), []);
  const addFromQuick = (line, origin) => {
    const flavour = flavours.find((f) => f.id === line.flavourId);
    closeQuick();
    setFlights((l) => [...l, { id: Math.random().toString(36).slice(2), flavour, line, ...origin }]);
  };
  const landed = (flight) => {
    setFlights((l) => l.filter((f) => f.id !== flight.id));
    add(flight.line);
    tell(`${flight.flavour.name} is in your cart.`);
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header active={active} overHero={overHero} onCart={() => setCartOpen(true)} />
      <main id="main-content">
        <Hero onOrder={toShowcase} />
        <Story />
        <div id="flavours" className="showcase-track">
          <Showcase quickOpen={qv.open} onOpen={openQuick} />
        </div>
        <Reviews />
        <Instagram />
      </main>
      <Footer onToast={tell} />
      <QuickView flavour={qv.flavour} open={qv.open} onClose={closeQuick} onAdd={addFromQuick} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onToast={tell} />
      <Flights flights={flights} onDone={landed} />
      <Toast message={toast} />
    </>
  );
}
