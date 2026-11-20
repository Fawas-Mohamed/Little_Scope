import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminProvider, useAdmin, useAuth, signIn, signOut } from './store/AdminStore.jsx';
import { useRoute, go, ago, money, initials } from './ui/util.js';
import Icon from './ui/Icon.jsx';
import { Toasts, Avatar, Badge } from './ui/kit.jsx';
import BowlArt from '../art/BowlArt.jsx';
import { flavours } from '../data/flavours.js';
import Dashboard from './pages/Dashboard.jsx';
import Orders from './pages/Orders.jsx';
import Products from './pages/Products.jsx';
import Customers from './pages/Customers.jsx';
import Reviews from './pages/Reviews.jsx';
import Coupons from './pages/Coupons.jsx';
import Settings from './pages/Settings.jsx';
import './admin.css';

const NAV = [
  ['dashboard', 'Dashboard', 'dashboard'], ['orders', 'Orders', 'orders'], ['products', 'Products', 'products'],
  ['customers', 'Customers', 'customers'], ['reviews', 'Reviews', 'reviews'], ['coupons', 'Coupons', 'coupons'], ['settings', 'Settings', 'settings'],
];
const pageHref = (p) => (p === 'dashboard' ? '#/admin' : `#/admin/${p}`);

function Login() {
  const { settings } = useAdmin();
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [show, setShow] = useState(false), [err, setErr] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (email.trim().toLowerCase() !== settings.adminEmail.toLowerCase() || pw !== settings.password) { setErr('Incorrect email or password.'); return; }
    signIn({ name: settings.adminName, email: settings.adminEmail, at: Date.now() }); go('/admin');
  };
  return (
    <div className="a-login">
      <aside className="a-login-art">
        <a className="a-logo" href="#top">Little Scoop</a>
        <div className="art"><BowlArt flavour={flavours[1]} peek /></div>
        <h2>Run the shop,<br /><em>one scoop</em> at a time.</h2>
        <p>Orders, flavours, customers and reviews, all in one calm place.</p>
      </aside>
      <main className="a-login-form">
        <form onSubmit={submit} noValidate>
          <p className="a-kicker">Admin panel</p>
          <h1>Welcome back</h1>
          <p className="sub">Sign in to manage your store.</p>
          <label className="a-field"><span>Email</span><input type="email" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} placeholder="admin@littlescoop.com" autoFocus /></label>
          <label className="a-field"><span>Password</span>
            <div className="pw"><input type={show ? 'text' : 'password'} autoComplete="current-password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(''); }} placeholder="••••••••" /><button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}><Icon name="eye" size={18} /></button></div>
          </label>
          {err && <p className="a-form-err" role="alert">{err}</p>}
          <button className="a-btn block" type="submit">Sign in</button>
          <button className="a-btn ghost block" type="button" onClick={() => { setEmail(settings.adminEmail); setPw(settings.password); setErr(''); }}>Use demo credentials</button>
          <p className="demo">Demo login: <b>{settings.adminEmail}</b> / <b>{settings.password}</b></p>
          <a className="back" href="#top" onClick={() => { location.hash = ''; }}>← Back to the store</a>
        </form>
      </main>
    </div>
  );
}

function GlobalSearch() {
  const { orders, customers, products } = useAdmin();
  const [q, setQ] = useState(''), [open, setOpen] = useState(false), box = useRef(null);
  useEffect(() => { const on = (e) => { if (!box.current?.contains(e.target)) setOpen(false); }; addEventListener('mousedown', on); return () => removeEventListener('mousedown', on); }, []);
  useEffect(() => { const k = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); box.current?.querySelector('input').focus(); } }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  const res = useMemo(() => {
    const t = q.trim().toLowerCase(); if (t.length < 2) return null;
    return {
      orders: orders.filter((o) => o.id.toLowerCase().includes(t) || o.customerName.toLowerCase().includes(t)).slice(-4).reverse(),
      customers: customers.filter((c) => c.name.toLowerCase().includes(t) || c.email.includes(t)).slice(0, 4),
      products: products.filter((p) => p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t)).slice(0, 4),
    };
  }, [q, orders, customers, products]);
  const pick = (path) => { go(path); setOpen(false); setQ(''); };
  const none = res && !res.orders.length && !res.customers.length && !res.products.length;
  return (
    <div className="a-search" ref={box}>
      <Icon name="search" size={18} />
      <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="Search orders, customers, products" aria-label="Global search" />
      <kbd>Ctrl K</kbd>
      {open && res && (
        <div className="a-search-pop">
          {none && <p className="none">No results for “{q}”</p>}
          {res.orders.length > 0 && <><h4>Orders</h4>{res.orders.map((o) => <button key={o.id} onClick={() => pick(`/admin/orders/${o.id}`)}><Icon name="orders" size={16} /><span>{o.id} · {o.customerName}</span><b>{money(o.total)}</b></button>)}</>}
          {res.customers.length > 0 && <><h4>Customers</h4>{res.customers.map((c) => <button key={c.id} onClick={() => pick(`/admin/customers/${c.id}`)}><Icon name="users" size={16} /><span>{c.name}</span><small>{c.email}</small></button>)}</>}
          {res.products.length > 0 && <><h4>Products</h4>{res.products.map((p) => <button key={p.id} onClick={() => pick(`/admin/products/${p.id}`)}><Icon name="products" size={16} /><span>{p.name}</span><small>{p.sku}</small></button>)}</>}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const { orders, products, reviews, settings } = useAdmin();
  const [open, setOpen] = useState(false), box = useRef(null);
  useEffect(() => { const on = (e) => { if (!box.current?.contains(e.target)) setOpen(false); }; addEventListener('mousedown', on); return () => removeEventListener('mousedown', on); }, []);
  const items = useMemo(() => {
    const list = [];
    orders.filter((o) => o.status === 'pending').slice(-4).reverse().forEach((o) => list.push({ k: o.id, icon: 'orders', text: `New order ${o.id} from ${o.customerName}`, sub: `${money(o.total)} · ${ago(o.createdAt)}`, to: `/admin/orders/${o.id}` }));
    products.filter((p) => p.status === 'active' && p.stock <= settings.lowStockLevel).slice(0, 3).forEach((p) => list.push({ k: p.id, icon: 'alert', text: `${p.name} is low on stock`, sub: `${p.stock} left`, to: '/admin/products' }));
    reviews.filter((r) => r.status === 'pending').slice(0, 2).forEach((r) => list.push({ k: r.id, icon: 'reviews', text: `Review awaiting approval`, sub: `${r.customer} · ${r.productName}`, to: '/admin/reviews' }));
    return list;
  }, [orders, products, reviews, settings.lowStockLevel]);
  return (
    <div className="a-pop-wrap" ref={box}>
      <button className="a-icon-btn" onClick={() => setOpen(!open)} aria-label={`Notifications, ${items.length}`} aria-expanded={open}><Icon name="bell" size={20} />{items.length > 0 && <i className="dot">{items.length}</i>}</button>
      {open && (
        <div className="a-pop notif">
          <h4>Notifications</h4>
          {items.length === 0 && <p className="none">You are all caught up.</p>}
          {items.map((n) => <button key={n.k} onClick={() => { go(n.to); setOpen(false); }}><Icon name={n.icon} size={18} /><span><b>{n.text}</b><small>{n.sub}</small></span></button>)}
        </div>
      )}
    </div>
  );
}

function Shell({ user, parts }) {
  const { orders, reviews, toasts } = useAdmin();
  const [menu, setMenu] = useState(false), [prof, setProf] = useState(false), pbox = useRef(null);
  const page = parts[1] || 'dashboard';
  useEffect(() => setMenu(false), [page]);
  useEffect(() => { const on = (e) => { if (!pbox.current?.contains(e.target)) setProf(false); }; addEventListener('mousedown', on); return () => removeEventListener('mousedown', on); }, []);
  useEffect(() => { document.title = `${NAV.find((n) => n[0] === page)?.[1] || 'Admin'} · Little Scoop Admin`; return () => { document.title = 'Little Scoop — Real scoops, real flavour'; }; }, [page]);
  const counts = { orders: orders.filter((o) => o.status === 'pending').length, reviews: reviews.filter((r) => r.status === 'pending').length };
  const id = parts[2];
  const view = { dashboard: <Dashboard />, orders: <Orders id={id} />, products: <Products id={id} />, customers: <Customers id={id} />, reviews: <Reviews />, coupons: <Coupons />, settings: <Settings /> }[page] || <Dashboard />;
  return (
    <div className={`a-shell ${menu ? 'menu-open' : ''}`}>
      <aside className="a-side">
        <a className="a-logo" href="#/admin">Little Scoop<small>Admin</small></a>
        <nav aria-label="Admin">
          {NAV.map(([key, label, icon]) => (
            <a key={key} href={pageHref(key)} aria-current={page === key ? 'page' : undefined}><Icon name={icon} size={20} /><span>{label}</span>{counts[key] > 0 && <b>{counts[key]}</b>}</a>
          ))}
        </nav>
        <div className="a-side-foot">
          <a href="#top" onClick={() => { location.hash = ''; }} className="view-store"><Icon name="store" size={18} />View store</a>
          <button onClick={() => { signOut(); go('/admin/login'); }}><Icon name="logout" size={18} />Sign out</button>
        </div>
      </aside>
      <div className="a-scrim-nav" onClick={() => setMenu(false)} />
      <div className="a-main">
        <header className="a-top">
          <button className="a-icon-btn menu-btn" onClick={() => setMenu(true)} aria-label="Open menu"><Icon name="menu" size={22} /></button>
          <GlobalSearch />
          <div className="a-top-right">
            <Notifications />
            <div className="a-pop-wrap" ref={pbox}>
              <button className="a-profile" onClick={() => setProf(!prof)} aria-expanded={prof}><Avatar name={user.name} size={36} /><span><b>{user.name}</b><small>Administrator</small></span><Icon name="down" size={16} /></button>
              {prof && <div className="a-pop prof">
                <div className="who"><Avatar name={user.name} size={42} /><span><b>{user.name}</b><small>{user.email}</small></span></div>
                <button onClick={() => { go('/admin/settings'); setProf(false); }}><Icon name="settings" size={18} />Settings</button>
                <button onClick={() => { location.hash = ''; }}><Icon name="store" size={18} />View store</button>
                <button onClick={() => { signOut(); go('/admin/login'); }}><Icon name="logout" size={18} />Sign out</button>
              </div>}
            </div>
          </div>
        </header>
        <main className="a-content" key={page}>{view}</main>
      </div>
      <Toasts toasts={toasts} />
    </div>
  );
}

function Gate() {
  const path = useRoute(), user = useAuth();
  const parts = path.split('/').filter(Boolean);
  const login = parts[1] === 'login';
  useEffect(() => { if (!user && !login) go('/admin/login'); else if (user && login) go('/admin'); }, [user, login]);
  const { toasts } = useAdmin();
  if (!user) return <><Login /><Toasts toasts={toasts} /></>;
  if (login) return null;
  return <Shell user={user} parts={parts} />;
}

export default function AdminApp() {
  useEffect(() => { document.body.classList.add('is-admin'); window.scrollTo(0, 0); return () => document.body.classList.remove('is-admin'); }, []);
  return <AdminProvider><div className="adm"><Gate /></div></AdminProvider>;
}
