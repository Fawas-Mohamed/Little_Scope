import { useMemo, useState } from 'react';
import { useAdmin } from '../store/AdminStore.jsx';
import { STATUS_LABEL } from '../store/seed.js';
import { money, money0, fmtDate, ago, go } from '../ui/util.js';
import Icon from '../ui/Icon.jsx';
import { Badge, Avatar, Stars } from '../ui/kit.jsx';
import { AreaChart, Donut, Spark, HBars } from '../ui/charts.jsx';

const DAY = 86400000;
const COLORS = { pending: '#E8A33D', preparing: '#5B8DEF', 'out-for-delivery': '#9B7FD1', delivered: '#4CAF7A', cancelled: '#E26D6D', refunded: '#B9A79F' };
const live = (o) => o.status !== 'cancelled' && o.status !== 'refunded';

export default function Dashboard() {
  const { orders, customers, products, reviews, settings } = useAdmin();
  const [range, setRange] = useState(30);
  const d = useMemo(() => {
    const now = Date.now(), from = now - range * DAY, prev = from - range * DAY;
    const cur = orders.filter((o) => +new Date(o.createdAt) >= from), old = orders.filter((o) => +new Date(o.createdAt) >= prev && +new Date(o.createdAt) < from);
    const rev = (l) => l.filter(live).reduce((s, o) => s + o.total, 0);
    const R = rev(cur), Rp = rev(old), N = cur.length, Np = old.length;
    const newC = customers.filter((c) => +new Date(c.joinedAt) >= from).length, newCp = customers.filter((c) => +new Date(c.joinedAt) >= prev && +new Date(c.joinedAt) < from).length;
    const aov = cur.filter(live).length ? R / cur.filter(live).length : 0, aovp = old.filter(live).length ? Rp / old.filter(live).length : 0;
    const n = range <= 30 ? range : 30, bms = (range * DAY) / n;
    const buckets = Array.from({ length: n }, (_, i) => { const a = from + i * bms, b = a + bms; const list = cur.filter((o) => { const t = +new Date(o.createdAt); return t >= a && t < b; }); return { label: fmtDate(a, { month: 'short', day: 'numeric' }), full: range > 30 ? `${fmtDate(a, { month: 'short', day: 'numeric' })} – ${fmtDate(b - 1, { month: 'short', day: 'numeric' })}` : fmtDate(a, { weekday: 'short', month: 'short', day: 'numeric' }), value: +rev(list).toFixed(2), count: list.length, aov: list.filter(live).length ? rev(list) / list.filter(live).length : 0 }; });
    const status = Object.keys(COLORS).map((s) => ({ label: STATUS_LABEL[s], value: cur.filter((o) => o.status === s).length, color: COLORS[s] }));
    const by = {}; cur.filter(live).forEach((o) => o.items.forEach((i) => { by[i.productId || i.name] = (by[i.productId || i.name] || 0) + i.qty * i.price; }));
    const top = Object.entries(by).map(([k, v]) => { const p = products.find((x) => x.id === k || x.name === k); return { label: p?.name || k, value: +v.toFixed(2), color: p?.color || '#C9877E' }; }).sort((a, b) => b.value - a.value).slice(0, 6);
    return { R, Rp, N, Np, newC, newCp, aov, aovp, buckets, status, top };
  }, [orders, customers, products, range]);

  const delta = (a, b) => (b ? ((a - b) / b) * 100 : a ? 100 : 0);
  const kpis = [
    { label: 'Revenue', value: money0(d.R, settings.currency), delta: delta(d.R, d.Rp), icon: 'dollar', spark: d.buckets.map((b) => b.value) },
    { label: 'Orders', value: d.N, delta: delta(d.N, d.Np), icon: 'orders', spark: d.buckets.map((b) => b.count) },
    { label: 'New customers', value: d.newC, delta: delta(d.newC, d.newCp), icon: 'users', spark: d.buckets.map((_, i) => (i * 7 + 3) % 5 + 1) },
    { label: 'Avg. order value', value: money(d.aov, settings.currency), delta: delta(d.aov, d.aovp), icon: 'chart', spark: d.buckets.map((b) => b.aov) },
  ];
  const recent = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 7);
  const low = products.filter((p) => p.status === 'active' && p.stock <= settings.lowStockLevel).sort((a, b) => a.stock - b.stock).slice(0, 5);
  const pendingRev = reviews.filter((r) => r.status === 'pending').slice(0, 3);
  const hour = new Date().getHours(), greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="a-page">
      <div className="a-page-head">
        <div><h1>{greet}, {settings.adminName.split(' ')[0]}</h1><p>Here is what is happening in your shop today.</p></div>
        <div className="a-seg" role="tablist" aria-label="Date range">{[[7, '7 days'], [30, '30 days'], [90, '90 days']].map(([v, l]) => <button key={v} role="tab" aria-selected={range === v} className={range === v ? 'on' : ''} onClick={() => setRange(v)}>{l}</button>)}</div>
      </div>

      <div className="a-kpis">
        {kpis.map((k) => (
          <article className="a-card kpi" key={k.label}>
            <div className="kpi-top"><span className="ico"><Icon name={k.icon} size={20} /></span><Spark values={k.spark} color={k.delta >= 0 ? '#4CAF7A' : '#E26D6D'} /></div>
            <p>{k.label}</p><strong>{k.value}</strong>
            <span className={`delta ${k.delta >= 0 ? 'up' : 'down'}`}><Icon name={k.delta >= 0 ? 'up' : 'dn'} size={14} />{Math.abs(k.delta).toFixed(1)}%<small>vs previous {range} days</small></span>
          </article>
        ))}
      </div>

      <div className="a-grid g-2-1">
        <section className="a-card"><header className="a-card-head"><h2>Revenue</h2><span className="a-muted">{money0(d.R, settings.currency)} in the last {range} days</span></header><AreaChart data={d.buckets} format={(v) => (v >= 1000 ? `${settings.currency}${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : money0(v, settings.currency))} /></section>
        <section className="a-card"><header className="a-card-head"><h2>Orders by status</h2></header>
          <div className="donut-box"><Donut segments={d.status} center={d.N} /><ul className="legend">{d.status.map((s) => <li key={s.label}><i style={{ background: s.color }} />{s.label}<b>{s.value}</b></li>)}</ul></div>
        </section>
      </div>

      <div className="a-grid g-1-1-1">
        <section className="a-card"><header className="a-card-head"><h2>Top flavours</h2><span className="a-muted">by revenue</span></header><HBars rows={d.top} format={(v) => money0(v, settings.currency)} /></section>
        <section className="a-card"><header className="a-card-head"><h2>Low stock</h2><button className="a-link" onClick={() => go('/admin/products')}>Manage</button></header>
          {low.length === 0 ? <p className="a-muted-p">All products are well stocked.</p> : <ul className="a-list">{low.map((p) => <li key={p.id}><span className="sw" style={{ background: p.color }} /><span className="grow"><b>{p.name}</b><small>{p.sku}</small></span><Badge tone={p.stock <= 8 ? 'red' : 'amber'}>{p.stock} left</Badge></li>)}</ul>}
        </section>
        <section className="a-card"><header className="a-card-head"><h2>Reviews to approve</h2><button className="a-link" onClick={() => go('/admin/reviews')}>Open</button></header>
          {pendingRev.length === 0 ? <p className="a-muted-p">Nothing waiting for approval.</p> : <ul className="a-list">{pendingRev.map((r) => <li key={r.id} className="col"><span className="row"><Stars n={r.rating} /><small>{r.customer} · {r.productName}</small></span><span className="quote">“{r.text}”</span></li>)}</ul>}
        </section>
      </div>

      <section className="a-card">
        <header className="a-card-head"><h2>Recent orders</h2><button className="a-link" onClick={() => go('/admin/orders')}>View all</button></header>
        <div className="a-table-wrap"><table className="a-table stack">
          <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>{recent.map((o) => (
            <tr key={o.id} onClick={() => go(`/admin/orders/${o.id}`)} className="click">
              <td data-label="Order"><b>{o.id}</b></td>
              <td data-label="Customer"><span className="who"><Avatar name={o.customerName} size={30} />{o.customerName}</span></td>
              <td data-label="Date">{ago(o.createdAt)}</td><td data-label="Total"><b>{money(o.total, settings.currency)}</b></td>
              <td data-label="Status"><Badge>{STATUS_LABEL[o.status]}</Badge></td>
            </tr>))}</tbody>
        </table></div>
      </section>
    </div>
  );
}
