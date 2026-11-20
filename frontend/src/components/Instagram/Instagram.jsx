import { flavours } from '../../data/flavours.js';
import { instaImgs } from '../../data/productImages.js';
import PhotoArt from '../../art/PhotoArt.jsx';
import { useReveal } from '../../hooks/useReveal.js';
import './Instagram.css';

const TILES = [[0, 0, '2.4k'], [1, 1, '1.8k'], [2, 2, '3.1k'], [3, 0, '1.2k'], [5, 1, '2.7k'], [6, 2, '1.9k']];
const HANDLE = 'littlescoop';

export default function Instagram() {
  const ref = useReveal(.1);
  const real = instaImgs();
  return (
    <section id="instagram" className="sec insta" ref={ref}>
      <div className="sec-inner">
        <div className="insta-head">
          <p className="kicker rv" style={{ justifyContent: 'center' }}>Follow along</p>
          <h2 className="sec-title rv" style={{ '--d': '.08s' }}>@{HANDLE}</h2>
          <p className="lead rv" style={{ '--d': '.16s' }}>Daily scoops, behind-the-scenes churning and new flavours before anyone else.</p>
        </div>
        <div className="insta-grid">
          {TILES.map(([f, v, likes], i) => (
            <a className="tile rv" key={i} href={`https://instagram.com/${HANDLE}`} target="_blank" rel="noreferrer" style={{ '--d': `${.1 + i * .07}s` }} aria-label={`Instagram post ${i + 1}`}>
              {real[i] ? <img src={real[i]} alt="" loading="lazy" /> : <PhotoArt flavour={flavours[f]} index={v} />}
              <span className="over"><svg viewBox="0 0 24 24"><path d="M12 21c-5-3.5-8.5-7-8.5-11A4.8 4.8 0 0 1 12 7.5 4.8 4.8 0 0 1 20.5 10c0 4-3.5 7.5-8.5 11z" /></svg>{likes}</span>
            </a>
          ))}
        </div>
        <div className="insta-cta rv" style={{ '--d': '.5s' }}>
          <a className="btn" href={`https://instagram.com/${HANDLE}`} target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r=".6" /></svg>Follow on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
