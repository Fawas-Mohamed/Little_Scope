import { useEffect, useMemo, useState } from 'react';
import { useAdmin } from '../store/AdminStore.jsx';
import { money, fmtDate, uid } from '../ui/util.js';
import Icon from '../ui/Icon.jsx';
import { Badge, Toggle, Empty, Modal, Confirm, Field } from '../ui/kit.jsx';

const blank = () => ({ id: '', code: '', type: 'percent', value: '', minOrder: '0', limit: '100', expires: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), active: true, uses: 0 });
const isExpired = (c) => new Date(c.expires + 'T23:59:59') < new Date();

function CouponForm({ coupon, onClose }) {
  const { coupons, settings, dispatch, toast } = useAdmin();
  const editing = !!coupon?.id;
  const [f, setF] = useState(blank()), [err, setErr] = useState({});
  useEffect(() => { if (coupon) { setF({ ...blank(), ...coupon, value: String(coupon.value ?? ''), minOrder: String(coupon.minOrder ?? 0), limit: String(coupon.limit ?? 0) }); setErr({}); } }, [coupon]);
  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); setErr((e) => ({ ...e, [k]: '' })); };
  const submit = (e) => {
    e.preventDefault(); const er = {}, code = f.code.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(code)) er.code = 'Use 3 to 20 letters or numbers.';
    else if (coupons.some((c) => c.code === code && c.id !== f.id)) er.code = 'This code already exists.';
    const v = parseFloat(f.value); if (!(v > 0)) er.value = 'Enter a value above 0.'; else if (f.type === 'percent' && v > 100) er.value = 'A percentage cannot exceed 100.';
    if (!(parseInt(f.limit, 10) > 0)) er.limit = 'Enter a usage limit.';
    if (!f.expires) er.expires = 'Choose an expiry date.';
    setErr(er); if (Object.keys(er).length) return;
    dispatch({ type: 'coupon/save', coupon: { ...f, id: f.id || uid('K'), code, value: v, minOrder: parseFloat(f.minOrder) || 0, limit: parseInt(f.limit, 10) } });
    toast(editing ? `${code} updated` : `${code} created`); onClose();
  };
  return (
    <Modal open={!!coupon} onClose={onClose} title={editing ? 'Edit coupon' : 'New coupon'} subtitle="Discount codes customers can use at checkout" width="560px"
      footer={<><button className="a-btn ghost" onClick={onClose}>Cancel</button><button className="a-btn" form="coupon-form" type="submit">{editing ? 'Save changes' : 'Create coupon'}</button></>}>
      <form id="coupon-form" className="a-form" onSubmit={submit} noValidate>
        <Field label="Code" error={err.code} className="full"><input className="a-input mono" value={f.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="SUMMER15" /></Field>
        <Field label="Discount type"><select className="a-input" value={f.type} onChange={(e) => set('type', e.target.value)}><option value="percent">Percentage (%)</option><option value="fixed">Fixed amount ({settings.currency})</option></select></Field>
        <Field label={f.type === 'percent' ? 'Percent off' : `Amount off (${settings.currency})`} error={err.value}><input className="a-input" inputMode="decimal" value={f.value} onChange={(e) => set('value', e.target.value)} placeholder={f.type === 'percent' ? '15' : '5'} /></Field>
        <Field label={`Minimum order (${settings.currency})`}><input className="a-input" inputMode="decimal" value={f.minOrder} onChange={(e) => set('minOrder', e.target.value)} /></Field>
        <Field label="Usage limit" error={err.limit}><input className="a-input" inputMode="numeric" value={f.limit} onChange={(e) => set('limit', e.target.value)} /></Field>
        <Field label="Expires" error={err.expires}><input className="a-input" type="date" value={f.expires} onChange={(e) => set('expires', e.target.value)} /></Field>
        <div className="a-field"><span>Status</span><label className="a-check"><input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} />Active</label></div>
      </form>
    </Modal>
  );
}

export default function Coupons() {
  const { coupons, settings, dispatch, toast } = useAdmin();
  const [edit, setEdit] = useState(null), [del, setDel] = useState(null);
  const stats = useMemo(() => ({ active: coupons.filter((c) => c.active && !isExpired(c)).length, uses: coupons.reduce((s, c) => s + c.uses, 0) }), [coupons]);
  const copy = async (code) => { try { await navigator.clipboard.writeText(code); toast(`${code} copied`); } catch { toast('Copy is not available here', 'err'); } };
  return (
    <div className="a-page">
      <div className="a-page-head"><div><h1>Coupons</h1><p>{stats.active} active codes · {stats.uses} total uses</p></div><button className="a-btn" onClick={() => setEdit(blank())}><Icon name="plus" size={18} />New coupon</button></div>
      {coupons.length === 0 ? <section className="a-card"><Empty icon="coupons" title="No coupons yet" text="Create a code to reward your customers." /></section> : (
        <div className="a-coupons">{coupons.map((c) => {
          const exp = isExpired(c), pct = Math.min(100, (c.uses / c.limit) * 100);
          return (
            <article className={`a-coupon ${!c.active || exp ? 'off' : ''}`} key={c.id}>
              <div className="top"><button className="code" onClick={() => copy(c.code)} aria-label={`Copy ${c.code}`}>{c.code}<Icon name="copy" size={15} /></button><Badge tone={exp ? 'red' : c.active ? 'green' : 'grey'}>{exp ? 'Expired' : c.active ? 'Active' : 'Paused'}</Badge></div>
              <p className="val">{c.type === 'percent' ? `${c.value}% off` : `${money(c.value, settings.currency)} off`}</p>
              <p className="a-muted">{c.minOrder > 0 ? `Min. order ${money(c.minOrder, settings.currency)}` : 'No minimum order'} · expires {fmtDate(c.expires + 'T12:00:00')}</p>
              <div className="use"><span>{c.uses} / {c.limit} used</span><i><u style={{ width: `${pct}%` }} /></i></div>
              <div className="foot"><Toggle checked={c.active} onChange={(v) => { dispatch({ type: 'coupon/save', coupon: { ...c, active: v } }); toast(`${c.code} ${v ? 'activated' : 'paused'}`); }} label={`${c.code} active`} /><span><button className="a-icon-btn" onClick={() => setEdit(c)} aria-label={`Edit ${c.code}`}><Icon name="edit" size={17} /></button><button className="a-icon-btn" onClick={() => setDel(c)} aria-label={`Delete ${c.code}`}><Icon name="trash" size={17} /></button></span></div>
            </article>);
        })}</div>
      )}
      <CouponForm coupon={edit} onClose={() => setEdit(null)} />
      <Confirm open={!!del} title="Delete coupon?" message={`${del?.code} will stop working immediately.`} onConfirm={() => { dispatch({ type: 'coupon/delete', id: del.id }); toast(`${del.code} deleted`); }} onClose={() => setDel(null)} />
    </div>
  );
}
