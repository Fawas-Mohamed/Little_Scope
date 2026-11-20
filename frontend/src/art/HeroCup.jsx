import { useId } from 'react';
import { lighten, darken, mix, rng } from './colors.js';

/** Hero product: a scoop on a ribbed brand cup. Drawn in the 600 x 920 box used by the hero cup placement (ratio of a real cut-out). */
export default function HeroCup({ scoop, band, name }) {
  const id = useId().replace(/:/g, '');
  const hi = lighten(scoop, .5), lo = darken(scoop, .26), mid = darken(scoop, .1);
  const rand = rng(name.length * 313);
  const specks = Array.from({ length: 22 }, () => { const a = rand() * 6.283, d = Math.sqrt(rand()) * 220; return [300 + Math.cos(a) * d, 320 + Math.sin(a) * d, 4 + rand() * 6, rand() * 180]; });
  const skirt = Array.from({ length: 11 }, (_, i) => [92 + i * 41.6, 520 + Math.sin((i / 10) * Math.PI) * 18 + (i % 2) * 8]);
  const ribs = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  return (
    <svg viewBox="0 0 600 920" width="100%" height="100%" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id={`${id}s`} cx=".36" cy=".28" r=".95"><stop offset="0" stopColor={hi} /><stop offset=".5" stopColor={scoop} /><stop offset="1" stopColor={lo} /></radialGradient>
        <linearGradient id={`${id}c`} x1="0" x2="1"><stop offset="0" stopColor="#E3D0BD" /><stop offset=".4" stopColor="#FFFAF2" /><stop offset=".78" stopColor="#F1E1CF" /><stop offset="1" stopColor="#DCC6B0" /></linearGradient>
        <linearGradient id={`${id}d`} x1="0" x2="1"><stop offset="0" stopColor={darken(band, .12)} /><stop offset=".45" stopColor={lighten(band, .2)} /><stop offset="1" stopColor={darken(band, .15)} /></linearGradient>
      </defs>
      <circle cx="300" cy="316" r="238" fill={`url(#${id}s)`} />
      <g stroke={hi} strokeWidth="11" strokeLinecap="round" fill="none" opacity=".34">
        <path d="M130 290Q300 440 450 258" /><path d="M150 190Q290 290 470 186" /><path d="M170 410Q320 470 430 380" />
      </g>
      {specks.map(([x, y, r, a], i) => <ellipse key={i} cx={x} cy={y} rx={r * 1.3} ry={r} fill={darken(scoop, .35)} opacity=".35" transform={`rotate(${a} ${x} ${y})`} />)}
      <ellipse cx="204" cy="176" rx="52" ry="26" fill="#fff" opacity=".42" transform="rotate(-32 204 176)" />
      {skirt.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 34 : 38} fill={i % 2 ? mid : scoop} />)}
      <ellipse cx="300" cy="528" rx="218" ry="30" fill={scoop} />
      <path d="M78 540C88 740 140 880 300 896 460 880 512 740 522 540 470 580 380 592 300 592 220 592 130 580 78 540Z" fill={`url(#${id}c)`} />
      {ribs.map((i) => <path key={i} d={`M${300 + i * 46} 592C${300 + i * 50} 700 ${300 + i * 34} 820 ${300 + i * 30} 894`} stroke="#D6BEA8" strokeWidth="3" fill="none" opacity=".55" />)}
      <path d="M86 640C150 676 230 688 300 688 370 688 450 676 514 640L504 720C440 752 370 762 300 762 230 762 160 752 96 720Z" fill={`url(#${id}d)`} />
      <text x="300" y="734" textAnchor="middle" fontFamily="'Baloo 2', cursive" fontWeight="800" fontSize="54" fill="#fff" opacity=".95" letterSpacing="-1">Little Scoop</text>
      <path d="M78 540C130 580 220 592 300 592 380 592 470 580 522 540" stroke="#fff" strokeWidth="5" fill="none" opacity=".85" />
    </svg>
  );
}
