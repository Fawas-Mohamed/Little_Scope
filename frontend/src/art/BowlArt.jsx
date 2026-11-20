import { useId } from 'react';
import { Garnish } from './Garnish.jsx';
import { lighten, darken, mix, rng } from './colors.js';

/**
 * One showcase bowl (or cone) drawn in the sprite-cell coordinate system: 876 x 1168, base point (438, 1100).
 * `peek` = the front-on, slightly taller version shown on hover.
 */
export default function BowlArt({ flavour, peek = false }) {
  const id = useId().replace(/:/g, '');
  const c = flavour.color;
  const hi = lighten(c, .5), lo = darken(c, .28), mid = darken(c, .1);
  const R = peek ? 322 : 300;
  const cy = flavour.cone ? 520 : peek ? 520 : 548;
  const rimY = 800;
  const rand = rng(flavour.id.length * 977 + (peek ? 3 : 1));
  const [spCol, spN, spR] = flavour.speckle;
  const specks = Array.from({ length: spN }, () => {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * (R - 26);
    return [438 + Math.cos(a) * d, cy + Math.sin(a) * d * .92, spR * (.6 + rand() * .8), rand() * 180];
  });
  const scallops = Array.from({ length: 15 }, (_, i) => {
    const t = i / 14, x = 438 - 262 + t * 524;
    return [x, rimY - 18 + Math.sin(t * Math.PI) * 26 + (i % 2) * 8];
  });
  const ribs = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
  const dripX = peek ? 560 : 540;
  return (
    <svg viewBox="0 0 876 1168" width="876" height="1168" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id={`${id}s`} cx=".36" cy=".28" r=".95"><stop offset="0" stopColor={hi} /><stop offset=".5" stopColor={c} /><stop offset="1" stopColor={lo} /></radialGradient>
        <linearGradient id={`${id}b`} x1="0" x2="1"><stop offset="0" stopColor="#DCC6B2" /><stop offset=".42" stopColor="#FFF9F0" /><stop offset=".75" stopColor="#F0DFCD" /><stop offset="1" stopColor="#D9C2AD" /></linearGradient>
        <radialGradient id={`${id}g`}><stop offset="0" stopColor="#6e3e2e" stopOpacity=".34" /><stop offset="1" stopColor="#6e3e2e" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}w`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#E9BE7E" /><stop offset="1" stopColor="#C98F4C" /></linearGradient>
        <clipPath id={`${id}cc`}><path d="M236 776 438 1098 640 776Z" /></clipPath>
      </defs>
      <ellipse cx="438" cy="1104" rx="340" ry="30" fill={`url(#${id}g)`} />
      {flavour.garnish.map(([kind, x, y, size, rot], i) => (
        <g key={i} transform={`rotate(${rot} ${x + size / 2} ${y + size / 2})`}><Garnish kind={kind} x={x} y={y} width={size} height={size} /></g>
      ))}

      {flavour.cone ? <>
        <path d="M236 776 438 1098 640 776Z" fill={`url(#${id}w)`} />
        <g clipPath={`url(#${id}cc)`} stroke="#9a6430" strokeWidth="4" opacity=".55">
          {Array.from({ length: 9 }, (_, i) => <path key={`a${i}`} d={`M${196 + i * 52} 760 L${420 + (i - 4) * 26} 1110`} />)}
          {Array.from({ length: 9 }, (_, i) => <path key={`b${i}`} d={`M${680 - i * 52} 760 L${456 + (4 - i) * 26} 1110`} />)}
        </g>
      </> : <ellipse cx="438" cy={rimY} rx="322" ry="64" fill="#CDB6A2" />}

      {/* scoop */}
      <circle cx="438" cy={cy} r={R} fill={`url(#${id}s)`} />
      <g stroke={hi} strokeWidth="11" strokeLinecap="round" fill="none" opacity=".34">
        <path d={`M${438 - R * .68} ${cy - R * .1} Q438 ${cy + R * .38} ${438 + R * .64} ${cy - R * .24}`} />
        <path d={`M${438 - R * .55} ${cy - R * .44} Q${438 + R * .1} ${cy - R * .12} ${438 + R * .7} ${cy - R * .5}`} />
        <path d={`M${438 - R * .44} ${cy + R * .3} Q${438 + R * .2} ${cy + R * .56} ${438 + R * .56} ${cy + R * .22}`} />
      </g>
      {specks.map(([x, y, r, a], i) => <ellipse key={i} cx={x} cy={y} rx={r * 1.4} ry={r} fill={spCol} opacity=".62" transform={`rotate(${a} ${x} ${y})`} />)}
      <ellipse cx={438 - R * .4} cy={cy - R * .5} rx={R * .22} ry={R * .11} fill="#fff" opacity=".42" transform={`rotate(-32 ${438 - R * .4} ${cy - R * .5})`} />
      {/* scalloped skirt where the scoop meets the rim */}
      {scallops.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 38 : 42} fill={i % 2 ? mid : c} />)}
      <ellipse cx="438" cy={rimY - 14} rx="280" ry="30" fill={c} />
      <ellipse cx="438" cy={rimY - 26} rx="270" ry="14" fill={hi} opacity=".28" />

      {flavour.cone ? (
        <g>
          <path d="M296 968H580L556 1100H320Z" fill={`url(#${id}b)`} />
          <ellipse cx="438" cy="968" rx="142" ry="22" fill="#F7EBDD" />
          <ellipse cx="438" cy="970" rx="124" ry="14" fill="#CDB6A2" opacity=".5" />
          <ellipse cx="438" cy="1100" rx="122" ry="12" fill="#CDB6A2" />
        </g>
      ) : (
        <g>
          <path d="M116 800C118 990 222 1098 438 1102 654 1098 758 990 760 800 700 858 560 874 438 874 316 874 176 858 116 800Z" fill={`url(#${id}b)`} />
          {ribs.map((i) => <path key={i} d={`M${438 + i * 54} 874C${438 + i * 62} 960 ${438 + i * 36} 1050 ${438 + i * 28} 1100`} stroke="#D2B9A3" strokeWidth="3.5" fill="none" opacity=".6" />)}
          <path d="M116 800C176 858 316 874 438 874 560 874 700 858 760 800" stroke="#fff" strokeWidth="5" fill="none" opacity=".85" />
          <ellipse cx="438" cy="1100" rx="214" ry="16" fill="#CDB6A2" />
        </g>
      )}
      {/* drip */}
      <path d={`M${dripX} ${rimY + 52}C${dripX} ${rimY + 100} ${dripX - 8} ${rimY + (peek ? 190 : 140)} ${dripX + 24} ${rimY + (peek ? 200 : 152)} ${dripX + 52} ${rimY + (peek ? 190 : 140)} ${dripX + 44} ${rimY + 100} ${dripX + 40} ${rimY + 50}Z`} fill={lighten(c, .12)} />
      <ellipse cx={dripX + 20} cy={rimY + 90} rx="5" ry="22" fill="#fff" opacity=".3" />
    </svg>
  );
}
