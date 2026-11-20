import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';
import { initials } from './util.js';

export function useEsc(on, fn) {
  useEffect(() => { if (!on) return undefined; const k = (e) => e.key === 'Escape' && fn(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [on, fn]);
}

// shared layer: centred modal or right-hand drawer, with scrim, Esc, focus handling
function Layer({ open, onClose, title, subtitle, children, footer, kind, width }) {
  const ref = useRef(null);
  useEsc(open, onClose);
  useEffect(() => { if (open) { const t = setTimeout(() => ref.current?.querySelector('input,select,textarea,button')?.focus({ preventScroll: true }), 80); document.body.style.overflow = 'hidden'; return () => { clearTimeout(t); document.body.style.overflow = ''; }; } return undefined; }, [open]);
  return (
    <div className={`a-layer ${kind} ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="a-scrim" onClick={onClose} />
      <section className="a-panel" ref={ref} style={width ? { '--w': width } : undefined} role="dialog" aria-modal="true" aria-label={title}>
        <header><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="a-icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button></header>
        <div className="a-panel-body">{open ? children : null}</div>
        {footer && <footer>{open ? footer : null}</footer>}
      </section>
    </div>
  );
}
export const Modal = (p) => <Layer {...p} kind="modal" />;
export const Drawer = (p) => <Layer {...p} kind="drawer" />;

export function Confirm({ open, title, message, confirmLabel = 'Delete', danger = true, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="440px" footer={<><button className="a-btn ghost" onClick={onClose}>Cancel</button><button className={`a-btn ${danger ? 'danger' : ''}`} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button></>}>
      <p className="a-muted-p">{message}</p>
    </Modal>
  );
}

const TONE = { pending: 'amber', preparing: 'blue', 'out-for-delivery': 'violet', delivered: 'green', cancelled: 'red', refunded: 'grey', active: 'green', draft: 'grey', blocked: 'red', approved: 'green', hidden: 'grey', expired: 'red', low: 'amber', out: 'red' };
export const Badge = ({ tone, children }) => <span className={`a-badge ${tone || TONE[String(children).toLowerCase().replace(/ /g, '-')] || 'grey'}`}>{children}</span>;

export const Toggle = ({ checked, onChange, label }) => (
  <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`a-switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}><i /></button>
);

export const Avatar = ({ name, size = 36, color }) => <span className="a-avatar" style={{ width: size, height: size, fontSize: size * .38, background: color || undefined }}>{initials(name)}</span>;

export function Field({ label, error, hint, children, className = '' }) {
  return <label className={`a-field ${error ? 'bad' : ''} ${className}`}><span>{label}</span>{children}{error ? <small className="err">{error}</small> : hint ? <small>{hint}</small> : null}</label>;
}

export function Pager({ p }) {
  if (p.total === 0) return null;
  const nums = []; for (let i = 1; i <= p.pages; i++) if (i === 1 || i === p.pages || Math.abs(i - p.page) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
  return (
    <div className="a-pager">
      <span>Showing {p.from}–{p.to} of {p.total}</span>
      <div>
        <button disabled={p.page === 1} onClick={() => p.setPage(p.page - 1)} aria-label="Previous page"><Icon name="left" size={16} /></button>
        {nums.map((n, i) => (n === '…' ? <em key={`e${i}`}>…</em> : <button key={n} className={n === p.page ? 'on' : ''} onClick={() => p.setPage(n)}>{n}</button>))}
        <button disabled={p.page === p.pages} onClick={() => p.setPage(p.page + 1)} aria-label="Next page"><Icon name="right" size={16} /></button>
      </div>
    </div>
  );
}

export const Empty = ({ icon = 'box', title, text }) => <div className="a-empty"><Icon name={icon} size={34} /><h3>{title}</h3><p>{text}</p></div>;

export function Toasts({ toasts }) {
  return <div className="a-toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className={`a-toast ${t.kind}`}><Icon name={t.kind === 'err' ? 'alert' : 'check'} size={18} />{t.message}</div>)}</div>;
}

export const Stars = ({ n }) => <span className="a-stars" aria-label={`${n} of 5`}>{[1, 2, 3, 4, 5].map((i) => <svg key={i} viewBox="0 0 24 24" className={i <= n ? 'on' : ''}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg>)}</span>;
