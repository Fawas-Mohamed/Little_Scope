import { useState } from 'react';
import { goTo, NAV_LINKS } from '../Header/Header.jsx';
import { useReveal } from '../../hooks/useReveal.js';
import './Footer.css';

const Social = ({ label, children }) => <a href="#top" onClick={(e) => e.preventDefault()} aria-label={label}><svg viewBox="0 0 24 24">{children}</svg></a>;

export default function Footer({ onToast }) {
  const ref = useReveal(.1);
  const [email, setEmail] = useState('');
  const [error, setError] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError(true); return; }
    setError(false); setEmail(''); onToast('Thanks for subscribing. Sweet things ahead.');
  };
  return (
    <footer id="contact" className="footer" ref={ref}>
      <div className="foot-inner">
        <div className="foot-cta">
          <h2 className="rv">Ready for a <em>little scoop</em> of something lovely?</h2>
          <button className="btn light rv" style={{ '--d': '.12s' }} onClick={() => goTo('flavours')}>Order now</button>
        </div>

        <div className="foot-grid">
          <div className="foot-brand rv" style={{ '--d': '.1s' }}>
            <a className="foot-logo" href="#top" onClick={(e) => { e.preventDefault(); goTo('top'); }}>Little Scoop</a>
            <p>Small-batch ice cream, made by hand with real ingredients and a lot of love.</p>
            <div className="socials">
              <Social label="Instagram"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r=".6" /></Social>
              <Social label="Facebook"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5c0-.3.2-.5.5-.5z" /></Social>
              <Social label="TikTok"><path d="M16 3v10.5a4.5 4.5 0 1 1-4.5-4.5M16 3c.3 2.4 2 4 4.5 4.2" /></Social>
            </div>
          </div>

          <nav className="foot-col rv" style={{ '--d': '.16s' }} aria-label="Explore">
            <h3>Explore</h3>
            {NAV_LINKS.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); goTo(id); }}>{label}</a>)}
          </nav>

          <div className="foot-col rv" style={{ '--d': '.22s' }}>
            <h3>Visit us</h3>
            <p>Trincomalee, Colombo<br />Batticalo and Germany</p>
            <p>Mon to Fri · 10am – 9pm<br />Sat and Sun · 9am – 10pm</p>
            <a href="mailto:https://neirahtech.com">https://neirahtech.com</a>
          </div>

          <form className="foot-news rv" style={{ '--d': '.28s' }} onSubmit={submit} noValidate>
            <h3>Sweet news</h3>
            <p>New flavours and little treats, once a month.</p>
            <div className={`field ${error ? 'bad' : ''}`}>
              <label className="sr-only" htmlFor="newsletter-email">Email address</label>
              <input id="newsletter-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(false); }} placeholder="Your email" aria-invalid={error} aria-describedby={error ? 'newsletter-error' : undefined} />
              <button type="submit" aria-label="Subscribe"><svg viewBox="0 0 36 12"><path d="M0 6h35M30 1l5 5-5 5" /></svg></button>
            </div>
            <small id={error ? 'newsletter-error' : undefined} role={error ? 'alert' : undefined}>{error ? 'Please enter a valid email address.' : 'No spam. Unsubscribe anytime.'}</small>
          </form>
        </div>

        <div className="foot-bottom">
          <span>© 2026 Little Scoop. All rights reserved.</span>
          <span className="legal"><a href="#top" onClick={(e) => e.preventDefault()}>Privacy</a><a href="#top" onClick={(e) => e.preventDefault()}>Terms</a><a href="#/admin">Admin</a></span>
          <span>Develop By: NeirahTech</span>
        </div>
      </div>
    </footer>
  );
}
