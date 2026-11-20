import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { loadState, saveState, KEY, SESSION } from './persist.js';
import { makeSeed } from './seed.js';

const Ctx = createContext(null);
let sessionFallback = null;

function reducer(s, a) {
  switch (a.type) {
    case 'replace': return a.state;
    case 'reset': return makeSeed();
    case 'order/status': return { ...s, orders: s.orders.map((o) => (o.id === a.id && o.status !== a.status ? { ...o, status: a.status, history: [...o.history, { status: a.status, at: new Date().toISOString() }] } : o)) };
    case 'order/bulk': return { ...s, orders: s.orders.map((o) => (a.ids.includes(o.id) && o.status !== a.status ? { ...o, status: a.status, history: [...o.history, { status: a.status, at: new Date().toISOString() }] } : o)) };
    case 'order/note': return { ...s, orders: s.orders.map((o) => (o.id === a.id ? { ...o, note: a.note } : o)) };
    case 'product/save': return { ...s, products: s.products.some((p) => p.id === a.product.id) ? s.products.map((p) => (p.id === a.product.id ? a.product : p)) : [a.product, ...s.products] };
    case 'product/delete': return { ...s, products: s.products.filter((p) => p.id !== a.id) };
    case 'product/stock': return { ...s, products: s.products.map((p) => (p.id === a.id ? { ...p, stock: Math.max(0, p.stock + a.delta) } : p)) };
    case 'customer/update': return { ...s, customers: s.customers.map((c) => (c.id === a.id ? { ...c, ...a.patch } : c)) };
    case 'customer/delete': return { ...s, customers: s.customers.filter((c) => c.id !== a.id) };
    case 'review/update': return { ...s, reviews: s.reviews.map((r) => (r.id === a.id ? { ...r, ...a.patch } : r)) };
    case 'review/delete': return { ...s, reviews: s.reviews.filter((r) => r.id !== a.id) };
    case 'coupon/save': return { ...s, coupons: s.coupons.some((c) => c.id === a.coupon.id) ? s.coupons.map((c) => (c.id === a.coupon.id ? a.coupon : c)) : [a.coupon, ...s.coupons] };
    case 'coupon/delete': return { ...s, coupons: s.coupons.filter((c) => c.id !== a.id) };
    case 'settings': return { ...s, settings: { ...s.settings, ...a.patch } };
    default: return s;
  }
}

export function AdminProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } saveState(state); }, [state]);
  // pick up orders placed from the storefront (same tab or another tab)
  useEffect(() => {
    const sync = () => dispatch({ type: 'replace', state: loadState() });
    const st = (e) => { if (e.key === KEY) sync(); };
    window.addEventListener('ls-admin-updated', sync); window.addEventListener('storage', st);
    return () => { window.removeEventListener('ls-admin-updated', sync); window.removeEventListener('storage', st); };
  }, []);

  const [toasts, setToasts] = useState([]);
  const toastTimers = useRef(new Map());
  useEffect(() => () => { toastTimers.current.forEach(clearTimeout); toastTimers.current.clear(); }, []);
  const toast = useCallback((message, kind = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, kind }]);
    const timer = setTimeout(() => { setToasts((t) => t.filter((x) => x.id !== id)); toastTimers.current.delete(id); }, 3200);
    toastTimers.current.set(id, timer);
  }, []);

  const value = useMemo(() => ({ ...state, dispatch, toast, toasts }), [state, toasts, toast]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAdmin = () => useContext(Ctx);

export function useAuth() {
  const read = () => { try { return JSON.parse(localStorage.getItem(SESSION)) || sessionFallback; } catch { return sessionFallback; } };
  const [user, setUser] = useState(read);
  useEffect(() => { const on = () => setUser(read()); window.addEventListener('ls-admin-session', on); return () => window.removeEventListener('ls-admin-session', on); }, []);
  return user;
}
export function signIn(user) { sessionFallback = user; try { localStorage.setItem(SESSION, JSON.stringify(user)); } catch { /* Keep the session for this tab when storage is unavailable. */ } window.dispatchEvent(new Event('ls-admin-session')); }
export function signOut() { sessionFallback = null; try { localStorage.removeItem(SESSION); } catch { /* The in-memory session is cleared either way. */ } window.dispatchEvent(new Event('ls-admin-session')); }
