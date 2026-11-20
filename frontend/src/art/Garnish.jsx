import { useId } from 'react';

// Small illustrated garnish pieces, each drawn in a 100x100 box. Used for hero garnish and bowl garnish.
export function Garnish({ kind, ...rest }) {
  const id = useId().replace(/:/g, '');
  const u = (n) => `url(#${id}${n})`;
  const grad = (n, stops, o = {}) => (
    <radialGradient id={`${id}${n}`} cx={o.cx ?? '.35'} cy={o.cy ?? '.3'} r={o.r ?? '.85'}>
      {stops.map(([off, col]) => <stop key={off} offset={off} stopColor={col} />)}
    </radialGradient>
  );
  const seeds = [[34, 44], [50, 40], [66, 44], [41, 58], [59, 58], [50, 72], [33, 62], [67, 62]];
  let body;
  switch (kind) {
    case 'strawberry':
      body = <>
        <defs>{grad('a', [[0, '#FF7388'], [.55, '#E0283F'], [1, '#A3162B']])}</defs>
        <path d="M50 95C20 74 8 46 19 30 30 17 44 24 50 28 56 24 70 17 81 30 92 46 80 74 50 95Z" fill={u('a')} />
        {seeds.map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="1.5" ry="2.3" fill="#FFE9A8" />)}
        <path d="M50 27 36 13 46 20 50 6 54 20 64 13Z" fill="#4C9A3E" />
        <ellipse cx="34" cy="38" rx="7" ry="3.5" fill="#fff" opacity=".35" transform="rotate(-35 34 38)" />
      </>; break;
    case 'strawberryHalf':
      body = <>
        <defs>{grad('a', [[0, '#FF6F84'], [1, '#C21B35']])}{grad('b', [[0, '#FFD6DC'], [1, '#F58EA0']], { cx: '.5', cy: '.5' })}</defs>
        <path d="M50 95C20 74 8 46 19 30 30 17 44 24 50 28 56 24 70 17 81 30 92 46 80 74 50 95Z" fill={u('a')} />
        <path d="M50 88C27 70 17 48 25 35 33 25 44 30 50 34 56 30 67 25 75 35 83 48 73 70 50 88Z" fill={u('b')} />
        <ellipse cx="50" cy="56" rx="7" ry="20" fill="#FFF1F3" opacity=".9" />
        {[[34, 46], [66, 46], [38, 64], [62, 64], [50, 80]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="1.2" ry="2" fill="#E45068" />)}
        <path d="M50 28 38 14 47 20 50 8 53 20 62 14Z" fill="#4C9A3E" />
      </>; break;
    case 'pistachio':
      body = <g transform="rotate(-25 50 50)">
        <defs>{grad('a', [[0, '#F3E5C6'], [1, '#C9B282']])}{grad('b', [[0, '#C4E58A'], [1, '#7FAA45']])}</defs>
        <ellipse cx="50" cy="52" rx="25" ry="35" fill={u('a')} />
        <path d="M50 17C38 30 38 72 50 88 62 72 62 30 50 17Z" fill="#6B8E3A" />
        <ellipse cx="50" cy="52" rx="11" ry="27" fill={u('b')} />
        <ellipse cx="46" cy="38" rx="3" ry="9" fill="#fff" opacity=".35" />
      </g>; break;
    case 'pistachioShelled':
      body = <>
        <defs>{grad('a', [[0, '#C8E58C'], [1, '#6F9A3C']])}</defs>
        <ellipse cx="50" cy="52" rx="22" ry="30" fill={u('a')} transform="rotate(20 50 52)" />
        <path d="M38 34C48 28 62 34 66 46" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".4" />
      </>; break;
    case 'crumbs':
      body = <>{[[22, 66, 8, '#9CC060'], [44, 52, 6, '#C9B282'], [60, 70, 9, '#8DB653'], [74, 48, 6, '#B7D07F'], [34, 34, 5, '#8DB653'], [56, 34, 4, '#C9B282'], [80, 74, 5, '#9CC060']].map(([x, y, r, c], i) => <circle key={i} cx={x} cy={y} r={r} fill={c} />)}</>; break;
    case 'chocChunk':
      body = <g transform="rotate(-8 50 50)">
        <defs><linearGradient id={`${id}a`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8A5538" /><stop offset="1" stopColor="#4A2518" /></linearGradient></defs>
        <rect x="16" y="20" width="68" height="62" rx="9" fill={u('a')} />
        <path d="M50 20V82M16 51H84" stroke="#3a1c10" strokeWidth="3" opacity=".7" />
        <path d="M20 26H46V47H20Z" fill="#fff" opacity=".13" />
      </g>; break;
    case 'cocoaBean':
      body = <g transform="rotate(35 50 50)">
        <defs>{grad('a', [[0, '#9A5F3E'], [1, '#4A2518']])}</defs>
        <ellipse cx="50" cy="50" rx="24" ry="36" fill={u('a')} />
        <path d="M50 16C40 38 60 62 50 84" stroke="#3a1c10" strokeWidth="3" fill="none" />
        <ellipse cx="40" cy="34" rx="4" ry="10" fill="#fff" opacity=".18" />
      </g>; break;
    case 'shaving':
      body = <>
        <defs><linearGradient id={`${id}a`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8A5538" /><stop offset="1" stopColor="#4A2518" /></linearGradient></defs>
        <path d="M14 66C16 32 62 22 86 48 62 40 38 46 30 74Z" fill={u('a')} />
        <path d="M24 56C34 40 56 36 74 44" stroke="#fff" strokeWidth="2.5" opacity=".25" fill="none" strokeLinecap="round" />
      </>; break;
    case 'vanillaFlower':
      body = <>
        <defs>{grad('a', [[0, '#FFFFFF'], [1, '#F1E6CE']], { cx: '.5', cy: '.8' })}</defs>
        {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx="50" cy="27" rx="12" ry="25" fill={u('a')} stroke="#E7D9BC" strokeWidth=".8" transform={`rotate(${i * 72} 50 50)`} />)}
        <circle cx="50" cy="50" r="8" fill="#F5C94B" /><circle cx="50" cy="50" r="3.5" fill="#E4A52A" />
      </>; break;
    case 'vanillaPod':
      body = <>
        <path d="M8 80C28 50 70 54 92 20" stroke="#3A2418" strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M10 76C30 49 70 52 90 22" stroke="#7A5238" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".7" />
      </>; break;
    case 'blueberry':
      body = <>
        <defs>{grad('a', [[0, '#7387E0'], [.6, '#3A44A0'], [1, '#1F2468']])}</defs>
        <circle cx="50" cy="52" r="34" fill={u('a')} />
        <path d="M50 32 44 40 50 46 56 40Z" fill="#161a52" opacity=".8" />
        <ellipse cx="38" cy="40" rx="8" ry="5" fill="#fff" opacity=".3" transform="rotate(-35 38 40)" />
      </>; break;
    case 'lavender':
      body = <>
        <path d="M30 96C40 64 50 40 62 8" stroke="#7A9A5A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {[[60, 14], [58, 24], [55, 34], [52, 44], [49, 54], [46, 64]].map(([x, y], i) => <g key={i}><ellipse cx={x - 4} cy={y} rx="4" ry="6" fill="#8E6BC9" transform={`rotate(-20 ${x - 4} ${y})`} /><ellipse cx={x + 5} cy={y + 2} rx="4" ry="6" fill="#A98BE0" transform={`rotate(20 ${x + 5} ${y + 2})`} /></g>)}
      </>; break;
    case 'mangoCube':
      body = <>
        <path d="M50 12 88 31 50 50 12 31Z" fill="#FFD36A" /><path d="M12 31 50 50V90L12 70Z" fill="#F7A92B" /><path d="M88 31 50 50V90L88 70Z" fill="#E88A14" />
        <path d="M30 28 52 20" stroke="#fff" strokeWidth="2.5" opacity=".5" strokeLinecap="round" />
      </>; break;
    case 'raspberry':
      body = <>
        <defs>{grad('a', [[0, '#F2587C'], [1, '#A3123B']])}</defs>
        {[[50, 26], [34, 34], [66, 34], [26, 52], [50, 48], [74, 52], [36, 70], [64, 70], [50, 84], [50, 64]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="14" fill={u('a')} />)}
        <path d="M50 16 40 8 50 12 60 6Z" fill="#4C9A3E" />
        <ellipse cx="42" cy="30" rx="5" ry="3" fill="#fff" opacity=".35" />
      </>; break;
    default: body = null;
  }
  return <svg viewBox="0 0 100 100" aria-hidden="true" {...rest}>{body}</svg>;
}
export default Garnish;
