import { flavours } from '../../data/flavours.js';

// deterministic PRNG so the demo data is the same every time it is generated
const rng = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const DAY = 86400000;

export const CATEGORIES = ['Classic', 'Fruit', 'Signature', 'Nutty', 'Tropical', 'Rich', 'Seasonal'];
export const ORDER_STATUSES = ['pending', 'preparing', 'out-for-delivery', 'delivered', 'cancelled', 'refunded'];
export const STATUS_LABEL = { pending: 'Pending', preparing: 'Preparing', 'out-for-delivery': 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded' };
export const SIZES = [{ id: 'small', name: 'Small', delta: -1 }, { id: 'regular', name: 'Regular', delta: 0 }, { id: 'large', name: 'Large', delta: 1 }];

const catOf = { 'Classic flavour': 'Classic', 'Fruit flavour': 'Fruit', 'Signature flavour': 'Signature', 'Nutty flavour': 'Nutty', 'Tropical flavour': 'Tropical', 'Rich flavour': 'Rich', 'Seasonal flavour': 'Seasonal' };
const EXTRA = [
  ['Salted Caramel', 'Signature', 7, '#D9A066', 'Silky caramel with flakes of sea salt.'],
  ['Mint Choc Chip', 'Classic', 6.5, '#9ED8B8', 'Fresh mint cream with dark chocolate shards.'],
  ['Coffee Crunch', 'Rich', 7, '#8B5E3C', 'Cold-brew coffee ice cream with toffee crunch.'],
  ['Lemon Sorbet', 'Fruit', 6, '#F6E27A', 'Zesty lemon sorbet, bright and refreshing.'],
  ['Cookies & Cream', 'Classic', 6.5, '#E8E0D8', 'Vanilla cream packed with chocolate cookie.'],
];

const FIRST = ['Amelia', 'Daniel', 'Sofia', 'Hiro', 'Priya', 'Lucas', 'Emma', 'Noah', 'Olivia', 'Liam', 'Mia', 'Ethan', 'Chloe', 'Mason', 'Zara', 'Leo', 'Isla', 'Oscar', 'Nora', 'Felix', 'Ava', 'Jack', 'Lena', 'Omar'];
const LAST = ['Rivera', 'Kim', 'Moreau', 'Tanaka', 'Shah', 'Bennett', 'Walsh', 'Patel', 'Novak', 'Reyes', 'Ito', 'Okafor', 'Laurent', 'Haddad', 'Silva', 'Murphy'];
const CITIES = ['Sweetville', 'Harbor Bay', 'Maple Grove', 'Riverside', 'Lakeview', 'Oakwood'];
const STREETS = ['Meadow Street', 'Orchard Lane', 'Willow Road', 'Cedar Avenue', 'Harbor Drive', 'Sunset Boulevard'];
const REVIEW_TEXT = [
  'You can actually see the vanilla seeds. Best I have ever had.', 'Deep, bitter-sweet and so creamy. Ordered again the next day.', 'Real strawberries, you taste the difference immediately.',
  'Properly nutty with a hint of salt. Addictive.', 'Floral without being soapy, which is rare. Elegant.', 'Tastes like a ripe mango on a warm day. Five stars.',
  'Tangy raspberry and the crunchiest waffle cone.', 'Delivery was fast and everything arrived perfectly frozen.', 'Generous scoops, friendly team. Our office orders weekly.',
  'A little too sweet for me, but the texture is great.', 'Arrived slightly soft, but the flavour made up for it.', 'My kids fought over the last scoop. Need a bigger tub!',
];

export const defaultSettings = {
  storeName: 'Little Scoop', email: 'https://neirahtech.com', phone: '+94 76 004 1594', address: 'Trincomalee, Colombo, Batticalo and Germany', currency: '$',
  deliveryFee: 3.5, freeThreshold: 50, taxRate: 8, openTime: '10:00', closeTime: '21:00',
  notify: { newOrder: true, lowStock: true, newReview: true, weeklyReport: false },
  lowStockLevel: 15, password: 'admin123', adminName: 'Alex Morgan', adminEmail: 'admin@littlescoop.com',
};

export function makeSeed() {
  const r = rng(20261119), pick = (a) => a[Math.floor(r() * a.length)], now = Date.now();
  const products = [
    ...flavours.map((f, i) => ({ id: `P${101 + i}`, name: f.name, sku: `LS-${f.id.slice(0, 3).toUpperCase()}-${101 + i}`, category: catOf[f.tag] || 'Classic', price: f.price, cost: +(f.price * .38).toFixed(2), stock: [64, 48, 12, 71, 33, 9, 40][i] ?? 40, status: 'active', popular: !!f.popular, color: f.color, description: f.description, image: '', flavourId: f.id, createdAt: new Date(now - (200 - i * 8) * DAY).toISOString() })),
    ...EXTRA.map(([name, category, price, color, description], i) => ({ id: `P${108 + i}`, name, sku: `LS-${name.slice(0, 3).toUpperCase()}-${108 + i}`, category, price, cost: +(price * .4).toFixed(2), stock: [55, 80, 22, 6, 90][i], status: i === 3 ? 'draft' : 'active', popular: i === 0, color, description, image: '', flavourId: null, createdAt: new Date(now - (60 - i * 7) * DAY).toISOString() })),
  ];
  const customers = Array.from({ length: 28 }, (_, i) => {
    const first = FIRST[i % FIRST.length], last = LAST[(i * 5 + 3) % LAST.length];
    return { id: `C${1001 + i}`, name: `${first} ${last}`, email: `${first}.${last}`.toLowerCase() + '@mail.com', phone: `+1 555 ${String(1000 + Math.floor(r() * 8999))}`, city: pick(CITIES), address: `${10 + Math.floor(r() * 90)} ${pick(STREETS)}`, joinedAt: new Date(now - Math.floor(r() * r() * 160 + 1) * DAY).toISOString(), status: i === 6 || i === 19 ? 'blocked' : 'active', note: '' };
  });
  const coupons = [
    { id: 'K1', code: 'WELCOME10', type: 'percent', value: 10, minOrder: 0, expires: new Date(now + 60 * DAY).toISOString().slice(0, 10), uses: 42, limit: 200, active: true },
    { id: 'K2', code: 'SUMMER15', type: 'percent', value: 15, minOrder: 25, expires: new Date(now + 20 * DAY).toISOString().slice(0, 10), uses: 118, limit: 150, active: true },
    { id: 'K3', code: 'FREESCOOP', type: 'fixed', value: 6.5, minOrder: 30, expires: new Date(now + 5 * DAY).toISOString().slice(0, 10), uses: 31, limit: 50, active: true },
    { id: 'K4', code: 'BLACKFRI25', type: 'percent', value: 25, minOrder: 40, expires: new Date(now + 9 * DAY).toISOString().slice(0, 10), uses: 0, limit: 300, active: false },
    { id: 'K5', code: 'OLDDEAL', type: 'fixed', value: 3, minOrder: 15, expires: new Date(now - 12 * DAY).toISOString().slice(0, 10), uses: 77, limit: 100, active: false },
  ];
  const active = products.filter((p) => p.status === 'active');
  const orders = [];
  for (let i = 0; i < 96; i++) {
    const ageDays = Math.pow(r(), 1.5) * 90, at = now - ageDays * DAY - r() * DAY * .5;
    const cust = pick(customers.filter((c) => c.status === 'active'));
    const lines = Array.from({ length: 1 + Math.floor(r() * 3.4) }, () => {
      const p = pick(active), size = pick(SIZES), qty = 1 + Math.floor(r() * 3);
      return { productId: p.id, name: p.name, size: size.name, qty, price: +(p.price + size.delta).toFixed(2) };
    });
    const subtotal = +lines.reduce((s, l) => s + l.price * l.qty, 0).toFixed(2);
    const coupon = r() < .22 ? pick(coupons.slice(0, 3)) : null;
    const discount = coupon ? +(coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value).toFixed(2) : 0;
    const delivery = subtotal - discount >= defaultSettings.freeThreshold ? 0 : defaultSettings.deliveryFee;
    const roll = r();
    let status;
    if (ageDays > 5) status = roll < .88 ? 'delivered' : roll < .95 ? 'cancelled' : 'refunded';
    else if (ageDays > 1) status = roll < .6 ? 'delivered' : roll < .75 ? 'out-for-delivery' : roll < .9 ? 'preparing' : 'cancelled';
    else status = roll < .45 ? 'pending' : roll < .8 ? 'preparing' : 'out-for-delivery';
    const flow = { pending: ['pending'], preparing: ['pending', 'preparing'], 'out-for-delivery': ['pending', 'preparing', 'out-for-delivery'], delivered: ['pending', 'preparing', 'out-for-delivery', 'delivered'], cancelled: ['pending', 'cancelled'], refunded: ['pending', 'preparing', 'out-for-delivery', 'delivered', 'refunded'] }[status];
    orders.push({
      id: '', customerId: cust.id, customerName: cust.name, email: cust.email, phone: cust.phone, address: `${cust.address}, ${cust.city}`, createdAt: new Date(at).toISOString(),
      items: lines, subtotal, discount, coupon: coupon?.code || '', delivery, total: +(subtotal - discount + delivery).toFixed(2), status, payment: pick(['card', 'card', 'card', 'wallet', 'cash']),
      history: flow.map((s, k) => ({ status: s, at: new Date(at + k * 55 * 60000).toISOString() })), note: '',
    });
  }
  orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach((o, i) => { o.id = `LS-${1001 + i}`; });
  const reviews = Array.from({ length: 26 }, (_, i) => {
    const p = pick(active), c = customers[(i * 3) % customers.length], rating = r() < .62 ? 5 : r() < .6 ? 4 : r() < .5 ? 3 : 2;
    return { id: `R${501 + i}`, productId: p.id, productName: p.name, customer: c.name, rating, text: pick(REVIEW_TEXT), createdAt: new Date(now - Math.floor(r() * 70 + (i < 4 ? 0 : 2)) * DAY).toISOString(), status: i < 5 ? 'pending' : i % 11 === 0 ? 'hidden' : 'approved', reply: i % 4 === 1 ? 'Thank you so much, we are thrilled you loved it!' : '' };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { v: 1, products, customers, orders, reviews, coupons, settings: { ...defaultSettings } };
}
