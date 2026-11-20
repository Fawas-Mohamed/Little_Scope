import { useId } from 'react';
import BowlArt from './BowlArt.jsx';
import { Garnish } from './Garnish.jsx';
import { lighten, darken, rng } from './colors.js';

/** Quick View photo stand-ins (3 per flavour): 0 hero shot, 1 close-up, 2 ingredients. Used until real photos exist. */
export default function PhotoArt({ flavour, index }) {
  const id = useId().replace(/:/g, '');
  const bg = ['#F7DFD3', '#F3D6C8', '#F9E4D9'][index];
  const c = flavour.color;
  const rand = rng(flavour.id.length * 31 + index);
  return (
    <svg viewBox="0 0 800 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={bg} /><stop offset="1" stopColor="#F1D3C3" /></linearGradient>
        <radialGradient id={`${id}l`} cx=".3" cy=".18" r=".9"><stop offset="0" stopColor="#fff" stopOpacity=".6" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}s`} cx=".36" cy=".28" r=".95"><stop offset="0" stopColor={lighten(c, .5)} /><stop offset=".5" stopColor={c} /><stop offset="1" stopColor={darken(c, .28)} /></radialGradient>
        <filter id={`${id}f`}><feGaussianBlur stdDeviation="16" /></filter>
      </defs>
      <rect width="800" height="1000" fill={`url(#${id}b)`} />
      <path d="M0 660C200 620 520 700 800 640V1000H0Z" fill="#F6E4DA" />
      <path d="M0 700C220 670 520 740 800 690" stroke="#E5CEC5" strokeWidth="3" fill="none" opacity=".6" />
      <rect width="800" height="1000" fill={`url(#${id}l)`} />
      {index === 0 && <g transform="translate(32 -6) scale(.84)"><BowlArt flavour={flavour} peek /></g>}
      {index === 1 && <g>
        <circle cx="400" cy="520" r="420" fill={`url(#${id}s)`} />
        {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${60 + rand() * 120} ${200 + i * 110}Q400 ${150 + i * 120 + rand() * 120} ${700 - rand() * 100} ${230 + i * 100}`} stroke="#fff" strokeWidth="16" opacity=".22" fill="none" strokeLinecap="round" />)}
        {Array.from({ length: 34 }, (_, i) => { const a = rand() * 6.28, d = Math.sqrt(rand()) * 380; return <ellipse key={i} cx={400 + Math.cos(a) * d} cy={520 + Math.sin(a) * d} rx={9 + rand() * 9} ry={6 + rand() * 6} fill={flavour.speckle[0]} opacity=".5" transform={`rotate(${rand() * 180} ${400 + Math.cos(a) * d} ${520 + Math.sin(a) * d})`} />; })}
        <ellipse cx="250" cy="260" rx="110" ry="50" fill="#fff" opacity=".4" transform="rotate(-32 250 260)" />
      </g>}
      {index === 2 && <g>
        {flavour.garnish.slice(0, 3).map(([kind], i) => (
          <g key={i} transform={`rotate(${[-12, 8, -4][i]} ${[220, 560, 400][i]} ${[360, 400, 700][i]})`}>
            <Garnish kind={kind} x={[90, 430, 250][i]} y={[230, 270, 570][i]} width={[270, 250, 300][i]} height={[270, 250, 300][i]} />
          </g>
        ))}
        <ellipse cx="400" cy="880" rx="260" ry="26" fill="#a86a56" opacity=".14" filter={`url(#${id}f)`} />
      </g>}
    </svg>
  );
}
