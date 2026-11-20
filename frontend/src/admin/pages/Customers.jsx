import { useEffect, useMemo, useState } from 'react';
import { useAdmin } from '../store/AdminStore.jsx';
import { STATUS_LABEL } from '../store/seed.js';
import { money, fmtDate, go, usePager, downloadCSV, ago } from '../ui/util.js';
import Icon from '../ui/Icon.jsx';
import { Badge, Avatar, Pager, Empty, Drawer, Confirm } from '../ui/kit.jsx';

export default function Customers({ id }) {
  const { customers, orders, settings, dispatch, toast } = useAdmin();
  const [q, setQ] = useState(''), [st, setSt] = useState('all'), [sort, setSort] = useState('recent'), [del, setDel] = useState(null);
  const stats = useMemo(() => { const m = {}; orders.forEach((o) => { const k = o.customerId; const s = (m[k] ||= { count: 0, spent: 0, last: '' }); s.count++; if (o.status !== 'cancelled' && o.status !== 'refunded') s.spent += o.total; if (o.createdAt > s.last) s.last = o.createdAt; }); return m; }, [orders]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = customers.filter((c) => (st === 'all' || c.status === st) && (!t || c.name.toLowerCase().includes(t) || c.email.includes(t) || c.city.toLowerCase().includes(t)));
    const g = (c) => stats[c.id] || { count: 0, spent: 0, last: '' };
    return list.sort((a, b) => (sort === 'spent' ? g(b).spent - g(a).spent : sort === 'orders' ? g(b).count - g(a).count : sort === 'name' ? a.name.localeCompare(b.name) : b.joinedAt.localeCompare(a.joinedAt)));
  }, [customers, q, st, sort, stats]);
  const pg = usePager(rows, 10);
  useEffect(() => pg.setPage(1), [q, st, sort]); // eslint-disable-line
  const c = customers.find((x) => x.id === id), s = c ? stats[c.id] || { count: 0, spent: 0, last: '' } : null;
  const theirs = c ? orders.filter((o) => o.customerId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
  const exportCsv = () => { downloadCSV('customers.csv', [['ID', 'Name', 'Email', 'Phone', 'City', 'Joined', 'Orders', 'Spent', 'Status'], ...rows.map((x) => [x.id, x.name, x.email, x.phone, x.city, x.joinedAt, (stats[x.id] || {}).count || 0, ((stats[x.id] || {}).spent || 0).toFixed(2), x.status])]); toast(`Exported ${rows.length} customers`); };
  const close = () => go('/admin/customers');

  return (
    <div className="a-page">
      <div className="a-page-head"><div><h1>Customers</h1><p>{customers.length} customers · {customers.filter((x) => x.status === 'blocked').length} blocked</p></div><button className="a-btn ghost" onClick={exportCsv}><Icon name="download" size={17} />Export CSV</button></div>
      <section className="a-card flush">
        <div className="a-toolbar">
          <label className="a-input-ico"><Icon name="search" size={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or city" aria-label="Search customers" /></label>
          <select className="a-input" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Status"><option value="all">All customers</option><option value="active">Active</option><option value="blocked">Blocked</option></select>
          <select className="a-input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort"><option value="recent">Newest first</option><option value="spent">Top spenders</option><option value="orders">Most orders</option><option value="name">Name A–Z</option></select>
        </div>
        {rows.length === 0 ? <Empty icon="users" title="No customers found" text="Try a different search." /> : (
          <div className="a-table-wrap"><table className="a-table stack">
            <thead><tr><th>Customer</th><th>City</th><th>Orders</th><th>Spent</th><th>Joined</th><th>Status</th><th /></tr></thead>
            <tbody>{pg.slice.map((x) => { const g = stats[x.id] || { count: 0, spent: 0 }; return (
              <tr key={x.id} className="click" onClick={() => go(`/admin/customers/${x.id}`)}>
                <td data-label="Customer"><span className="who"><Avatar name={x.name} size={34} /><span><b>{x.name}</b><small>{x.email}</small></span></span></td>
                <td data-label="City">{x.city || '—'}</td><td data-label="Orders">{g.count}</td><td data-label="Spent"><b>{money(g.spent, settings.currency)}</b></td>
                <td data-label="Joined">{fmtDate(x.joinedAt)}</td><td data-label="Status"><Badge>{x.status === 'active' ? 'Active' : 'Blocked'}</Badge></td>
                <td className="act"><button className="a-icon-btn" aria-label={`Open ${x.name}`}><Icon name="eye" size={18} /></button></td>
              </tr>); })}</tbody>
          </table></div>
        )}
        <Pager p={pg} />
      </section>

      <Drawer open={!!c} onClose={close} title={c?.name || ''} subtitle={c ? `Customer ${c.id} · joined ${fmtDate(c.joinedAt)}` : ''} width="520px"
        footer={c && <><button className="a-btn ghost danger-t" onClick={() => setDel(c)}><Icon name="trash" size={17} />Delete</button>
          <button className="a-btn ghost" onClick={() => { dispatch({ type: 'customer/update', id: c.id, patch: { status: c.status === 'active' ? 'blocked' : 'active' } }); toast(c.status === 'active' ? `${c.name} blocked` : `${c.name} unblocked`); }}>{c.status === 'active' ? 'Block customer' : 'Unblock'}</button>
          <a className="a-btn" href={`mailto:${c.email}`}><Icon name="mail" size={17} />Email</a></>}>
        {c && <div className="a-order">
          <div className="a-profile-card"><Avatar name={c.name} size={64} /><div><b>{c.name}</b><Badge>{c.status === 'active' ? 'Active' : 'Blocked'}</Badge></div></div>
          <div className="a-stats3"><div><small>Orders</small><b>{s.count}</b></div><div><small>Total spent</small><b>{money(s.spent, settings.currency)}</b></div><div><small>Last order</small><b>{s.last ? ago(s.last) : '—'}</b></div></div>
          <div className="a-info"><p><Icon name="mail" size={16} />{c.email}</p><p><Icon name="phone" size={16} />{c.phone}</p><p><Icon name="pin" size={16} />{[c.address, c.city].filter(Boolean).join(', ') || '—'}</p></div>
          <h3>Order history</h3>
          {theirs.length === 0 ? <p className="a-muted-p">No orders yet.</p> : <ul className="a-lines compact">{theirs.slice(0, 8).map((o) => <li key={o.id} className="click" onClick={() => go(`/admin/orders/${o.id}`)}><span className="grow"><b>{o.id}</b><small>{fmtDate(o.createdAt)}</small></span><Badge>{STATUS_LABEL[o.status]}</Badge><b>{money(o.total, settings.currency)}</b></li>)}</ul>}
        </div>}
      </Drawer>
      <Confirm open={!!del} title="Delete customer?" message={`${del?.name} will be removed from your customer list. Their past orders stay in your records.`} onConfirm={() => { dispatch({ type: 'customer/delete', id: del.id }); toast(`${del.name} deleted`); close(); }} onClose={() => setDel(null)} />
    </div>
  );
}
