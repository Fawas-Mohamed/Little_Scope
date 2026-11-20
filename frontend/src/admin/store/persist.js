import { makeSeed } from './seed.js';
import { flavours } from '../../data/flavours.js';

export const KEY = 'ls.admin.v1';
export const SESSION = 'ls.admin.session';

const isValidState = (state) => state && state.v === 1
  && ['products', 'orders', 'customers', 'reviews', 'coupons'].every((key) => Array.isArray(state[key]) && state[key].every((item) => item && typeof item === 'object' && !Array.isArray(item)))
  && state.orders.every((order) => Array.isArray(order.items) && Array.isArray(order.history))
  && state.settings && typeof state.settings === 'object' && state.settings.notify && typeof state.settings.notify === 'object';

export function loadState() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (isValidState(s)) return s; } catch { /* ignore */ }
  const seed = makeSeed(); saveState(seed); return seed;
}
export function saveState(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota or private mode */ } }

// storefront checkout writes straight into the admin data so a new order shows up in the panel
export function placeStorefrontOrder({ lines, subtotal, customer }) {
  const s = loadState();
  let cust = s.customers.find((c) => c.email.toLowerCase() === customer.email.toLowerCase());
  if (!cust) {
    cust = { id: `C${1001 + s.customers.length}`, name: customer.name, email: customer.email, phone: customer.phone, city: '', address: customer.address, joinedAt: new Date().toISOString(), status: 'active', note: '' };
    s.customers.push(cust);
  }
  const next = s.orders.reduce((m, o) => Math.max(m, parseInt(o.id.slice(3), 10)), 1000) + 1;
  const items = lines.map((l) => { const f = flavours.find((x) => x.id === l.flavourId); const p = s.products.find((x) => x.flavourId === l.flavourId); return { productId: p?.id || '', name: f?.name || l.flavourId, size: (l.size || 'regular').slice(0, 1).toUpperCase() + (l.size || 'regular').slice(1), qty: l.qty, price: +l.unit.toFixed(2) }; });
  const delivery = subtotal >= s.settings.freeThreshold ? 0 : s.settings.deliveryFee;
  const now = new Date().toISOString();
  const order = { id: `LS-${next}`, customerId: cust.id, customerName: cust.name, email: cust.email, phone: cust.phone, address: customer.address, createdAt: now, items, subtotal: +subtotal.toFixed(2), discount: 0, coupon: '', delivery, total: +(subtotal + delivery).toFixed(2), status: 'pending', payment: 'card', history: [{ status: 'pending', at: now }], note: '' };
  s.orders.push(order);
  s.products = s.products.map((p) => { const used = items.filter((i) => i.productId === p.id).reduce((n, i) => n + i.qty, 0); return used ? { ...p, stock: Math.max(0, p.stock - used) } : p; });
  saveState(s);
  window.dispatchEvent(new Event('ls-admin-updated'));
  return order;
}
