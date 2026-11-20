import { useId } from 'react';
/** Pastel takeaway bag, drawn in a 220 x 240 box, base centre at (110, 232). */
export default function BagArt() {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 220 240" width="100%" height="100%" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}a`} x1="0" x2="1"><stop offset="0" stopColor="#F0B9B4" /><stop offset=".45" stopColor="#FBD9D4" /><stop offset="1" stopColor="#EBB0AA" /></linearGradient>
        <radialGradient id={`${id}g`}><stop offset="0" stopColor="#6e3e2e" stopOpacity=".3" /><stop offset="1" stopColor="#6e3e2e" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="112" cy="234" rx="100" ry="10" fill={`url(#${id}g)`} />
      <path d="M44 74C72 20 148 20 176 74" fill="none" stroke="#E3A29B" strokeWidth="6" strokeLinecap="round" />
      <path d="M26 66H194L206 232H14Z" fill={`url(#${id}a)`} />
      <path d="M26 66H194L190 86H30Z" fill="#fff" opacity=".28" />
      <path d="M26 66 14 232M194 66 206 232" stroke="#E3A29B" strokeWidth="2" opacity=".5" />
      <ellipse cx="110" cy="66" rx="84" ry="9" fill="#C97F78" />
      <circle cx="110" cy="146" r="30" fill="#fff" opacity=".85" />
      <circle cx="110" cy="138" r="17" fill="#F28FA3" /><path d="M96 148H124L110 176Z" fill="#E8B96A" />
      <text x="110" y="204" textAnchor="middle" fontFamily="'Baloo 2', cursive" fontWeight="800" fontSize="20" fill="#8D4F49">Little Scoop</text>
    </svg>
  );
}
