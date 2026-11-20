import { useEffect, useMemo, useState } from 'react';
import { useAdmin } from '../store/AdminStore.jsx';
import { ORDER_STATUSES, STATUS_LABEL } from '../store/seed.js';
import { money, fmtDate, fmtTime, go, usePager, downloadCSV, ago } from '../ui/util.js';
import Icon from '../ui/Icon.jsx';
import { Badge, Avatar, Pager, Empty, Drawer, Confirm } from '../ui/kit.jsx';

const FLOW = ['pending', 'preparing', 'out-for-delivery', 'delivered'];
const NEXT_LABEL = { pending: 'Start preparing', preparing: 'Send out for delivery', 'out-for-delivery': 'Mark delivered' };
const DAY = 86400000;

function OrderDrawer({ id }) {
  const { orders, settings, dispatch, toast } = useAdmin();
  const o = orders.find((x) => x.id === id);
  const [note, setNote] = useState(''), [confirm, setConfirm] = useState(null);
  useEffect(() => setNote(o?.note || ''), [o?.id]); // eslint-disable-line
  const close = () => go('/admin/orders');
  const set = (status) => { dispatch({ type: 'order/status', id: o.id, status }); toast(`${o.id} marked ${STATUS_LABEL[status].toLowerCase()}`); };
  const idx = o ? FLOW.indexOf(o.status) : -1, next = idx >= 0 && idx < 3 ? FLOW[idx + 1] : null;
  return (
    <>
      <Drawer open={!!o} onClose={close} title={o ? `Order ${o.id}` : ''} subtitle={o ? `${fmtDate(o.createdAt)} at ${fmtTime(o.createdAt)}` : ''} width="560px"
        footer={o && <>
          <button className="a-btn ghost" onClick={() => window.print()}><Icon name="print" size={17} />Print</button>
          {(o.status === 'pending' || o.status === 'preparing') && <button className="a-btn ghost danger-t" onClick={() => setConfirm('cancelled')}>Cancel order</button>}
          {o.status === 'delivered' && <button className="a-btn ghost danger-t" onClick={() => setConfirm('refunded')}>Refund</button>}
          {next && <button className="a-btn" onClick={() => set(next)}>{NEXT_LABEL[o.status]}</button>}
        </>}>
        {o && (
          <div className="a-order">
            <div className="a-row-between"><Badge>{STATUS_LABEL[o.status]}</Badge><span className="a-muted">Paid by {o.payment}</span></div>
            {idx >= 0 && <ol className="a-steps">{FLOW.map((s, i) => <li key={s} className={i <= idx ? 'done' : ''}><i>{i < idx ? <Icon name="check" size={13} /> : i + 1}</i><span>{STATUS_LABEL[s]}</span></li>)}</ol>}
            <h3>Items</h3>
            <ul className="a-lines">{o.items.map((i, k) => <li key={k}><span className="grow"><b>{i.name}</b><small>{i.size} · {money(i.price, settings.currency)} each</small></span><span>× {i.qty}</span><b>{money(i.price * i.qty, settings.currency)}</b></li>)}</ul>
            <dl className="a-totals">
              <div><dt>Subtotal</dt><dd>{money(o.subtotal, settings.currency)}</dd></div>
              {o.discount > 0 && <div><dt>Discount {o.coupon && <em>{o.coupon}</em>}</dt><dd>−{money(o.discount, settings.currency)}</dd></div>}
              <div><dt>Delivery</dt><dd>{o.delivery ? money(o.delivery, settings.currency) : 'Free'}</dd></div>
              <div className="total"><dt>Total</dt><dd>{money(o.total, settings.currency)}</dd></div>
            </dl>
            <h3>Customer</h3>
            <div className="a-info">
              <div><Avatar name={o.customerName} size={40} /><span><b>{o.customerName}</b><small>{o.customerId}</small></span></div>
              <p><Icon name="mail" size={16} />{o.email}</p><p><Icon name="phone" size={16} />{o.phone}</p><p><Icon name="pin" size={16} />{o.address}</p>
            </div>
            <h3>Timeline</h3>
            <ul className="a-timeline">{[...o.history].reverse().map((h, k) => <li key={k}><i /><span><b>{STATUS_LABEL[h.status]}</b><small>{fmtDate(h.at)} · {fmtTime(h.at)}</small></span></li>)}</ul>
            <h3>Internal note</h3>
            <textarea className="a-input" rows="3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note only your team can see" />
            <button className="a-btn ghost sm" disabled={note === (o.note || '')} onClick={() => { dispatch({ type: 'order/note', id: o.id, note }); toast('Note saved'); }}>Save note</button>
          </div>
        )}
      </Drawer>
      <Confirm open={!!confirm} title={confirm === 'refunded' ? 'Refund this order?' : 'Cancel this order?'} message={`${o?.id} will be marked ${confirm}. The customer is not notified in this demo.`} confirmLabel={confirm === 'refunded' ? 'Refund order' : 'Cancel order'} onConfirm={() => set(confirm)} onClose={() => setConfirm(null)} />
    </>
  );
}

export default function Orders({ id }) {
  const { orders, settings, dispatch, toast } = useAdmin();
  const [q, setQ] = useState(''), [status, setStatus] = useState('all'), [pay, setPay] = useState('all'), [range, setRange] = useState('all');
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' }), [sel, setSel] = useState(new Set());
  const counts = useMemo(() => Object.fromEntries([['all', orders.length], ...ORDER_STATUSES.map((s) => [s, orders.filter((o) => o.status === s).length])]), [orders]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase(), since = range === 'all' ? 0 : Date.now() - range * DAY;
    const list = orders.filter((o) => (status === 'all' || o.status === status) && (pay === 'all' || o.payment === pay) && +new Date(o.createdAt) >= since && (!t || o.id.toLowerCase().includes(t) || o.customerName.toLowerCase().includes(t) || o.email.includes(t)));
    const m = sort.dir === 'asc' ? 1 : -1;
    return list.sort((a, b) => (sort.key === 'total' ? (a.total - b.total) * m : a.createdAt.localeCompare(b.createdAt) * m));
  }, [orders, q, status, pay, range, sort]);
  const pg = usePager(rows, 10);
  useEffect(() => { pg.setPage(1); setSel(new Set()); }, [q, status, pay, range]); // eslint-disable-line
  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
  const allOn = pg.slice.length > 0 && pg.slice.every((o) => sel.has(o.id));
  const flip = (oid) => setSel((s) => { const n = new Set(s); n.has(oid) ? n.delete(oid) : n.add(oid); return n; });
  const bulk = (st) => { dispatch({ type: 'order/bulk', ids: [...sel], status: st }); toast(`${sel.size} orders marked ${STATUS_LABEL[st].toLowerCase()}`); setSel(new Set()); };
  const exportCsv = () => { downloadCSV('orders.csv', [['Order', 'Customer', 'Email', 'Date', 'Items', 'Subtotal', 'Discount', 'Delivery', 'Total', 'Payment', 'Status'], ...rows.map((o) => [o.id, o.customerName, o.email, o.createdAt, o.items.map((i) => `${i.qty}x ${i.name} (${i.size})`).join('; '), o.subtotal, o.discount, o.delivery, o.total, o.payment, STATUS_LABEL[o.status]])]); toast(`Exported ${rows.length} orders`); };
  const Sort = ({ k, children }) => <button className={`a-sort ${sort.key === k ? 'on' : ''}`} onClick={() => toggleSort(k)}>{children}<Icon name={sort.key === k && sort.dir === 'asc' ? 'up' : 'dn'} size={14} /></button>;

  return (
    <div className="a-page">
      <div className="a-page-head"><div><h1>Orders</h1><p>{orders.length} orders in total · {counts.pending} waiting to be prepared</p></div>
        <button className="a-btn ghost" onClick={exportCsv}><Icon name="download" size={17} />Export CSV</button></div>

      <section className="a-card flush">
        <div className="a-tabs" role="tablist">{['all', ...ORDER_STATUSES].map((s) => <button key={s} role="tab" aria-selected={status === s} className={status === s ? 'on' : ''} onClick={() => setStatus(s)}>{s === 'all' ? 'All' : STATUS_LABEL[s]}<b>{counts[s]}</b></button>)}</div>
        <div className="a-toolbar">
          <label className="a-input-ico"><Icon name="search" size={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order, customer or email" aria-label="Search orders" /></label>
          <select className="a-input" value={pay} onChange={(e) => setPay(e.target.value)} aria-label="Payment"><option value="all">All payments</option><option value="card">Card</option><option value="wallet">Wallet</option><option value="cash">Cash</option></select>
          <select className="a-input" value={range} onChange={(e) => setRange(e.target.value === 'all' ? 'all' : +e.target.value)} aria-label="Date range"><option value="all">All time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>
        </div>
        {sel.size > 0 && <div className="a-bulk"><b>{sel.size} selected</b><button className="a-btn sm" onClick={() => bulk('preparing')}>Mark preparing</button><button className="a-btn sm" onClick={() => bulk('delivered')}>Mark delivered</button><button className="a-btn sm ghost danger-t" onClick={() => bulk('cancelled')}>Cancel</button><button className="a-link" onClick={() => setSel(new Set())}>Clear</button></div>}
        {rows.length === 0 ? <Empty icon="orders" title="No orders found" text="Try a different search or filter." /> : (
          <div className="a-table-wrap"><table className="a-table stack">
            <thead><tr><th className="chk"><input type="checkbox" checked={allOn} onChange={() => setSel(allOn ? new Set() : new Set(pg.slice.map((o) => o.id)))} aria-label="Select page" /></th><th>Order</th><th>Customer</th><th><Sort k="createdAt">Date</Sort></th><th>Items</th><th><Sort k="total">Total</Sort></th><th>Payment</th><th>Status</th><th /></tr></thead>
            <tbody>{pg.slice.map((o) => (
              <tr key={o.id} className={`click ${sel.has(o.id) ? 'sel' : ''}`} onClick={() => go(`/admin/orders/${o.id}`)}>
                <td className="chk" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel.has(o.id)} onChange={() => flip(o.id)} aria-label={`Select ${o.id}`} /></td>
                <td data-label="Order"><b>{o.id}</b></td>
                <td data-label="Customer"><span className="who"><Avatar name={o.customerName} size={30} /><span><b>{o.customerName}</b><small>{o.email}</small></span></span></td>
                <td data-label="Date"><span>{fmtDate(o.createdAt)}<small>{ago(o.createdAt)}</small></span></td>
                <td data-label="Items">{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                <td data-label="Total"><b>{money(o.total, settings.currency)}</b></td>
                <td data-label="Payment" className="cap">{o.payment}</td>
                <td data-label="Status"><Badge>{STATUS_LABEL[o.status]}</Badge></td>
                <td className="act"><button className="a-icon-btn" aria-label={`Open ${o.id}`}><Icon name="eye" size={18} /></button></td>
              </tr>))}</tbody>
          </table></div>
        )}
        <Pager p={pg} />
      </section>
      <OrderDrawer id={id} />
    </div>
  );
}
