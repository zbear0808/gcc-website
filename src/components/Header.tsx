import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCartCount } from '@/store/useStore';
import { CartIcon, CloseIcon, MenuIcon } from './Icons';

const navLinks = [
  { label: 'Builds', path: '/', end: true },
  { label: 'Parts', path: '/parts', end: false },
  { label: 'FAQ', path: '/faq', end: false },
];

const navClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`;

const Header: React.FC = () => {
  const cartCount = useCartCount();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header className="header">
      <div className="header-content">
        <button
          className="icon-btn mobile-menu-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <MenuIcon />
        </button>

        <Link to="/" className="header-title" aria-label="Zu Builds home">
          <span className="header-name trichromatic" data-text="Zu Builds">
            Zu Builds
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Main">
          {navLinks.map((link) => (
            <NavLink key={link.path} to={link.path} end={link.end} className={navClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <Link to="/cart" className="icon-btn cart-link" aria-label={`Cart, ${cartCount} items`}>
          <CartIcon />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>
      </div>

      {menuOpen && (
        <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}>
          <div className="sidebar" role="dialog" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
            <button className="icon-btn close-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <CloseIcon />
            </button>
            <nav className="mobile-nav" aria-label="Main">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.end}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                  {link.label}
                </NavLink>
              ))}
              <NavLink to="/cart" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                Cart{cartCount > 0 ? ` (${cartCount})` : ''}
              </NavLink>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
