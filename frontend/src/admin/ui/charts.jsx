import { useEffect, useRef, useState } from 'react';

function useWidth() {
  const ref = useRef(null); const [w, setW] = useState(600);
  useEffect(() => { const el = ref.current; if (!el) return undefined; const ro = new ResizeObserver(() => setW(el.clientWidth || 600)); ro.observe(el); setW(el.clientWidth || 600); return () => ro.disconnect(); }, []);
  return [ref, w];
}
const nice = (max) => { const p = Math.pow(10, Math.floor(Math.log10(max || 1))); const n = max / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };

export function AreaChart({ data, height = 280, format = (v) => v, color = '#C9877E' }) {
  const [ref, W] = useWidth(); const [hi, setHi] = useState(null);
  const pad = { l: 52, r: 14, t: 16, b: 30 }, H = height;
  const max = nice(Math.max(...data.map((d) => d.value), 1)), iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const x = (i) => pad.l + (data.length < 2 ? iw / 2 : (i / (data.length - 1)) * iw), y = (v) => pad.t + ih - (v / max) * ih;
  const pts = data.map((d, i) => [x(i), y(d.value)]);
  // smooth line (catmull-rom -> bezier)
  const line = pts.map((p, i) => { if (!i) return `M${p[0]},${p[1]}`; const p0 = pts[i - 2] || pts[i - 1], p1 = pts[i - 1], p3 = pts[i + 1] || p; const c1 = [p1[0] + (p[0] - p0[0]) / 6, p1[1] + (p[1] - p0[1]) / 6], c2 = [p[0] - (p3[0] - p1[0]) / 6, p[1] - (p3[1] - p1[1]) / 6]; return `C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p[0]},${p[1]}`; }).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]},${pad.t + ih} L${pts[0][0]},${pad.t + ih}Z`;
  const ticks = [0, .25, .5, .75, 1].map((t) => t * max), step = Math.max(1, Math.ceil(data.length / (W < 480 ? 4 : 8)));
  const move = (e) => { const r = e.currentTarget.getBoundingClientRect(), px = (e.clientX ?? e.touches?.[0]?.clientX) - r.left; setHi(Math.max(0, Math.min(data.length - 1, Math.round(((px - pad.l) / iw) * (data.length - 1))))); };
  return (
    <div className="a-chart" ref={ref}>
      <svg width={W} height={H} onMouseMove={move} onTouchMove={move} onMouseLeave={() => setHi(null)} role="img" aria-label="Revenue chart">
        <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".32" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {ticks.map((t, i) => <g key={i}><line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="grid" /><text x={pad.l - 10} y={y(t) + 4} textAnchor="end" className="tick">{format(t)}</text></g>)}
        {data.map((d, i) => i % step === 0 && <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="tick">{d.label}</text>)}
        <path d={area} fill="url(#ag)" /><path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        {hi != null && <g><line x1={x(hi)} x2={x(hi)} y1={pad.t} y2={pad.t + ih} className="guide" /><circle cx={x(hi)} cy={y(data[hi].value)} r="5" fill="#fff" stroke={color} strokeWidth="2.5" /></g>}
      </svg>
      {hi != null && <div className="a-tip" style={{ left: Math.min(Math.max(x(hi), 70), W - 70), top: y(data[hi].value) - 12 }}><b>{format(data[hi].value)}</b><span>{data[hi].full || data[hi].label}</span></div>}
    </div>
  );
}

export function Donut({ segments, size = 170, thickness = 26, center }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1, R = (size - thickness) / 2, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="a-donut" role="img" aria-label="Orders by status">
      <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="#F1E3DD" strokeWidth={thickness} />
      {segments.map((s) => { const len = (s.value / total) * C, off = acc; acc += len; return len > 0 && <circle key={s.label} cx={size / 2} cy={size / 2} r={R} fill="none" stroke={s.color} strokeWidth={thickness} strokeDasharray={`${Math.max(len - 3, .1)} ${C}`} strokeDashoffset={-off} transform={`rotate(-90 ${size / 2} ${size / 2})`} />; })}
      <text x="50%" y="47%" textAnchor="middle" className="d-num">{center}</text><text x="50%" y="60%" textAnchor="middle" className="d-lbl">orders</text>
    </svg>
  );
}

export function Spark({ values, color = '#C9877E', w = 92, h = 34 }) {
  const max = Math.max(...values, 1), min = Math.min(...values, 0), r = max - min || 1;
  const p = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * w},${h - 3 - ((v - min) / r) * (h - 8)}`).join(' ');
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true"><polyline points={p} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export const HBars = ({ rows, format = (v) => v }) => {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return <div className="a-hbars">{rows.map((r) => <div key={r.label} className="hb"><div className="hb-top"><span><i style={{ background: r.color }} />{r.label}</span><b>{format(r.value)}</b></div><div className="hb-bar"><i style={{ width: `${(r.value / max) * 100}%`, background: r.color }} /></div></div>)}</div>;
};
