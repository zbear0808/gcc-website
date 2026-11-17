import React from 'react';
import { Link } from 'react-router-dom';
import { GitHubIcon, EmailIcon } from './Icons';

const EMAIL = 'contact@gcccontrollers.com';
const GITHUB = 'https://github.com/gcc-controllers';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">Zu Builds</span>
          <p>Hand-built PhobGCC controllers and parts, tested for 30+ minutes each before they ship. Made in Seattle.</p>
        </div>

        <nav className="footer-col" aria-label="Shop">
          <span className="eyebrow">Shop</span>
          <Link to="/">Full builds &amp; kits</Link>
          <Link to="/parts">Parts</Link>
          <Link to="/cart">Cart</Link>
        </nav>

        <nav className="footer-col" aria-label="Help">
          <span className="eyebrow">Help</span>
          <Link to="/faq">FAQ</Link>
          <Link to="/faq#warranty">Warranty</Link>
          <Link to="/faq#shipping">Shipping</Link>
        </nav>

        <div className="footer-col">
          <span className="eyebrow">Contact</span>
          <a href={`mailto:${EMAIL}`} className="footer-icon-link">
            <EmailIcon /> {EMAIL}
          </a>
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="footer-icon-link">
            <GitHubIcon /> 3D models on GitHub
          </a>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} Zu Builds</div>
    </footer>
  );
};

export default Footer;
