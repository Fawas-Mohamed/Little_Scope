import { useEffect, useState } from 'react';
import { useAdmin, signIn } from '../store/AdminStore.jsx';
import { downloadJSON } from '../ui/util.js';
import Icon from '../ui/Icon.jsx';
import { Toggle, Field, Confirm } from '../ui/kit.jsx';

const TABS = [['store', 'Store', 'store'], ['delivery', 'Delivery & tax', 'truck'], ['notify', 'Notifications', 'bell'], ['account', 'Account', 'lock'], ['data', 'Data', 'box']];

export default function Settings() {
  const state = useAdmin(); const { settings, dispatch, toast } = state;
  const [tab, setTab] = useState('store'), [f, setF] = useState(settings), [err, setErr] = useState({}), [reset, setReset] = useState(false);
  const [pw, setPw] = useState({ cur: '', next: '', again: '' }), [pwErr, setPwErr] = useState({});
  useEffect(() => setF(settings), [settings]);
  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); setErr((e) => ({ ...e, [k]: '' })); };
  const dirty = JSON.stringify(f) !== JSON.stringify(settings);
  const save = (keys, rules = {}) => {
    const er = {}; Object.entries(rules).forEach(([k, fn]) => { const m = fn(f[k]); if (m) er[k] = m; });
    setErr(er); if (Object.keys(er).length) { toast('Please fix the highlighted fields', 'err'); return; }
    const patch = {}; keys.forEach((k) => { patch[k] = f[k]; });
    ['deliveryFee', 'freeThreshold', 'taxRate', 'lowStockLevel'].forEach((k) => { if (k in patch) patch[k] = parseFloat(patch[k]); });
    dispatch({ type: 'settings', patch }); toast('Settings saved');
  };
  const num = (min, max) => (v) => (v === '' || isNaN(+v) ? 'Enter a number.' : +v < min ? `Must be ${min} or more.` : max != null && +v > max ? `Must be ${max} or less.` : '');
  const mail = (v) => (/^\S+@\S+\.\S+$/.test(v) ? '' : 'Enter a valid email.');
  const req = (v) => (String(v).trim() ? '' : 'This field is required.');

  const changePw = (e) => {
    e.preventDefault(); const er = {};
    if (pw.cur !== settings.password) er.cur = 'Current password is incorrect.';
    if (pw.next.length < 6) er.next = 'Use at least 6 characters.';
    if (pw.next !== pw.again) er.again = 'Passwords do not match.';
    setPwErr(er); if (Object.keys(er).length) return;
    dispatch({ type: 'settings', patch: { password: pw.next } }); setPw({ cur: '', next: '', again: '' }); toast('Password updated');
  };
  const Save = ({ keys, rules }) => <div className="a-form-foot"><button className="a-btn" disabled={!dirty} onClick={() => save(keys, rules)}>Save changes</button><button className="a-btn ghost" disabled={!dirty} onClick={() => { setF(settings); setErr({}); }}>Discard</button></div>;

  return (
    <div className="a-page">
      <div className="a-page-head"><div><h1>Settings</h1><p>Manage your store, delivery rules and account.</p></div></div>
      <div className="a-settings">
        <nav className="a-subnav" aria-label="Settings sections">{TABS.map(([k, l, i]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><Icon name={i} size={18} />{l}</button>)}</nav>
        <section className="a-card">
          {tab === 'store' && <div className="a-form">
            <h2 className="full">Store details</h2>
            <Field label="Store name" error={err.storeName}><input className="a-input" value={f.storeName} onChange={(e) => set('storeName', e.target.value)} /></Field>
            <Field label="Contact email" error={err.email}><input className="a-input" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
            <Field label="Phone"><input className="a-input" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
            <Field label="Currency symbol"><select className="a-input" value={f.currency} onChange={(e) => set('currency', e.target.value)}>{['$', '€', '£', '¥', '₹'].map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Address" className="full"><input className="a-input" value={f.address} onChange={(e) => set('address', e.target.value)} /></Field>
            <Field label="Opens"><input className="a-input" type="time" value={f.openTime} onChange={(e) => set('openTime', e.target.value)} /></Field>
            <Field label="Closes"><input className="a-input" type="time" value={f.closeTime} onChange={(e) => set('closeTime', e.target.value)} /></Field>
            <div className="full"><Save keys={['storeName', 'email', 'phone', 'currency', 'address', 'openTime', 'closeTime']} rules={{ storeName: req, email: mail }} /></div>
          </div>}

          {tab === 'delivery' && <div className="a-form">
            <h2 className="full">Delivery & tax</h2>
            <Field label={`Delivery fee (${f.currency})`} error={err.deliveryFee}><input className="a-input" inputMode="decimal" value={f.deliveryFee} onChange={(e) => set('deliveryFee', e.target.value)} /></Field>
            <Field label={`Free delivery over (${f.currency})`} error={err.freeThreshold}><input className="a-input" inputMode="decimal" value={f.freeThreshold} onChange={(e) => set('freeThreshold', e.target.value)} /></Field>
            <Field label="Tax rate (%)" error={err.taxRate}><input className="a-input" inputMode="decimal" value={f.taxRate} onChange={(e) => set('taxRate', e.target.value)} /></Field>
            <Field label="Low stock warning at" error={err.lowStockLevel} hint="Products at or below this count are flagged"><input className="a-input" inputMode="numeric" value={f.lowStockLevel} onChange={(e) => set('lowStockLevel', e.target.value)} /></Field>
            <div className="full"><Save keys={['deliveryFee', 'freeThreshold', 'taxRate', 'lowStockLevel']} rules={{ deliveryFee: num(0), freeThreshold: num(0), taxRate: num(0, 100), lowStockLevel: num(0) }} /></div>
          </div>}

          {tab === 'notify' && <div className="a-prefs">
            <h2>Notifications</h2><p className="a-muted-p">Choose what the bell in the top bar tells you about.</p>
            {[['newOrder', 'New orders', 'Get alerted when a customer places an order.'], ['lowStock', 'Low stock', 'Warn me when a flavour is running out.'], ['newReview', 'New reviews', 'Tell me when a review needs approval.'], ['weeklyReport', 'Weekly report', 'Email a summary of sales every Monday.']].map(([k, t, d]) => (
              <div className="pref" key={k}><span><b>{t}</b><small>{d}</small></span><Toggle label={t} checked={settings.notify[k]} onChange={(v) => { dispatch({ type: 'settings', patch: { notify: { ...settings.notify, [k]: v } } }); toast(`${t} ${v ? 'on' : 'off'}`); }} /></div>
            ))}
          </div>}

          {tab === 'account' && <div>
            <div className="a-form"><h2 className="full">Profile</h2>
              <Field label="Full name" error={err.adminName}><input className="a-input" value={f.adminName} onChange={(e) => set('adminName', e.target.value)} /></Field>
              <Field label="Login email" error={err.adminEmail}><input className="a-input" type="email" value={f.adminEmail} onChange={(e) => set('adminEmail', e.target.value)} /></Field>
              <div className="full"><div className="a-form-foot"><button className="a-btn" disabled={!dirty} onClick={() => { const er = { adminName: req(f.adminName), adminEmail: mail(f.adminEmail) }; if (er.adminName || er.adminEmail) { setErr(er); toast('Please fix the highlighted fields', 'err'); return; } dispatch({ type: 'settings', patch: { adminName: f.adminName, adminEmail: f.adminEmail } }); signIn({ name: f.adminName, email: f.adminEmail, at: Date.now() }); toast('Profile updated'); }}>Save profile</button></div></div>
            </div>
            <form className="a-form sep" onSubmit={changePw} noValidate><h2 className="full">Change password</h2>
              <Field label="Current password" error={pwErr.cur} className="full"><input className="a-input" type="password" autoComplete="current-password" value={pw.cur} onChange={(e) => { setPw({ ...pw, cur: e.target.value }); setPwErr({}); }} /></Field>
              <Field label="New password" error={pwErr.next}><input className="a-input" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => { setPw({ ...pw, next: e.target.value }); setPwErr({}); }} /></Field>
              <Field label="Repeat new password" error={pwErr.again}><input className="a-input" type="password" autoComplete="new-password" value={pw.again} onChange={(e) => { setPw({ ...pw, again: e.target.value }); setPwErr({}); }} /></Field>
              <div className="full"><button className="a-btn" type="submit">Update password</button></div>
            </form>
          </div>}

          {tab === 'data' && <div className="a-prefs">
            <h2>Demo data</h2><p className="a-muted-p">Everything in this panel is mock data saved in your browser. Nothing is sent to a server.</p>
            <div className="pref"><span><b>Export all data</b><small>Download products, orders, customers, reviews and coupons as JSON.</small></span><button className="a-btn ghost sm" onClick={() => { downloadJSON('little-scoop-data.json', { products: state.products, orders: state.orders, customers: state.customers, reviews: state.reviews, coupons: state.coupons, settings: { ...settings, password: undefined } }); toast('Data exported'); }}><Icon name="download" size={16} />Export</button></div>
            <div className="pref"><span><b>Reset demo data</b><small>Replace everything with a fresh set of sample products, orders and customers.</small></span><button className="a-btn ghost sm danger-t" onClick={() => setReset(true)}>Reset</button></div>
          </div>}
        </section>
      </div>
      <Confirm open={reset} title="Reset all demo data?" message="Your changes (new products, order statuses, reviews and more) will be replaced with the original sample data." confirmLabel="Reset data" onConfirm={() => { dispatch({ type: 'reset' }); toast('Demo data restored'); }} onClose={() => setReset(false)} />
    </div>
  );
}
