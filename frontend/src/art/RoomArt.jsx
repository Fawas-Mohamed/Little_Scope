import { useId } from 'react';
/** Blush studio plate drawn at 1440 x 900: wall, window light, marble counter with a diagonal back edge. */
export default function RoomArt() {
  const id = useId().replace(/:/g, '');
  const veins = [
    'M-20 470C240 440 420 520 720 470S1180 380 1480 360',
    'M-20 640C200 600 460 700 760 640S1200 540 1480 520',
    'M-20 780C260 740 520 840 880 780S1260 700 1480 690',
    'M-20 540C300 520 600 600 900 540S1240 460 1480 440',
  ];
  return (
    <svg viewBox="0 0 1440 900" width="1440" height="900" aria-hidden="true" style={{ display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F8DEDB" /><stop offset="1" stopColor="#FCEDEA" /></linearGradient>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F8EBE4" /><stop offset=".5" stopColor="#F4E3DA" /><stop offset="1" stopColor="#EBD6CC" /></linearGradient>
        <radialGradient id={`${id}g`} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#FFF4E6" stopOpacity=".95" /><stop offset="1" stopColor="#FFF4E6" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}e`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C78F7C" stopOpacity=".16" /><stop offset="1" stopColor="#C78F7C" stopOpacity="0" /></linearGradient>
        <filter id={`${id}b`}><feGaussianBlur stdDeviation="34" /></filter>
        <filter id={`${id}v`}><feGaussianBlur stdDeviation="1.4" /></filter>
        <clipPath id={`${id}c`}><path d="M0 380 1440 260V900H0Z" /></clipPath>
      </defs>
      <rect width="1440" height="900" fill={`url(#${id}w)`} />
      <path d="M-60 -40 540 -40 160 520Z" fill="#fff" opacity=".22" filter={`url(#${id}b)`} />
      <ellipse cx="1000" cy="150" rx="520" ry="200" fill="#fff" opacity=".28" filter={`url(#${id}b)`} />
      <path d="M0 380 1440 260V900H0Z" fill={`url(#${id}m)`} />
      <path d="M0 380 1440 260V330L0 450Z" fill={`url(#${id}e)`} />
      <g clipPath={`url(#${id}c)`}>
        <ellipse cx="760" cy="640" rx="700" ry="260" fill={`url(#${id}g)`} />
        <g fill="none" stroke="#E5CEC5" strokeLinecap="round" filter={`url(#${id}v)`}>
          {veins.map((d, i) => <path key={i} d={d} strokeWidth={i % 2 ? 2 : 3.4} opacity={i % 2 ? .5 : .7} />)}
        </g>
      </g>
      <path d="M0 380 1440 260" stroke="#fff" strokeWidth="3" opacity=".75" />
    </svg>
  );
}
