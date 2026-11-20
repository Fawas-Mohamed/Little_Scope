import { useEffect, useState } from 'react';

export const money = (n, c = '$') => `${c}${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const money0 = (n, c = '$') => `${c}${Math.round(n || 0).toLocaleString('en-US')}`;
export const fmtDate = (iso, o = { month: 'short', day: 'numeric', year: 'numeric' }) => new Date(iso).toLocaleDateString('en-US', o);
export const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
export const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now'; if (m < 60) return `${m} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24); return d < 30 ? `${d} d ago` : fmtDate(iso);
};
export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
export const uid = (p) => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1e3)}`;

// tiny hash router: "#/admin/orders/LS-1001" -> ['admin','orders','LS-1001']
const read = () => (location.hash.startsWith('#/') ? location.hash.slice(1) : '');
export function useRoute() {
  const [path, setPath] = useState(read);
  useEffect(() => { const on = () => setPath(read()); addEventListener('hashchange', on); return () => removeEventListener('hashchange', on); }, []);
  return path;
}
export const go = (path) => { location.hash = path; };

export function usePager(items, size = 10) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / size));
  useEffect(() => { if (page > pages) setPage(pages); }, [pages, page]);
  return { page, setPage, pages, slice: items.slice((page - 1) * size, page * size), total: items.length, from: items.length ? (page - 1) * size + 1 : 0, to: Math.min(page * size, items.length) };
}

export function downloadCSV(name, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
}
export function downloadJSON(name, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
}
