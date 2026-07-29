import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { CartIcon } from './Icons';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const cart = useStore((state) => state.cart);
  const cartCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const navLinks = [
    { label: 'Builds', path: '/' },
    { label: 'Parts', path: '/parts' },
    { label: 'FAQ', path: '/faq' },
  ];

  return (
    <header className="header">
      <div className="header-content">
        <button 
          className="mobile-menu-btn" 
          onClick={toggleSidebar}
          aria-label="Menu"
        >
          {sidebarOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="5" cy="5" r="1.5" />
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="19" cy="5" r="1.5" />
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
              <circle cx="5" cy="19" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
              <circle cx="19" cy="19" r="1.5" />
            </svg>
          )}
        </button>

        <div className="header-title" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <h1 className="header-name trichromatic" data-text="GCC Shop">
            GCC Shop
          </h1>
        </div>

        <nav className="desktop-nav">
          {navLinks.map((link) => (
            <span
              key={link.path}
              className="nav-link"
              onClick={() => navigate(link.path)}
              style={{ cursor: 'pointer' }}
            >
              {link.label}
            </span>
          ))}
        </nav>

        <div 
          className="cart-icon-container" 
          onClick={() => navigate('/cart')}
          style={{ cursor: 'pointer' }}
        >
          <CartIcon />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </div>
      </div>

      {sidebarOpen && (
        <div className="sidebar-overlay">
          <div className="sidebar">
            <button className="close-btn" onClick={closeSidebar}>
              <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <nav className="mobile-nav">
              {navLinks.map((link) => (
                <span
                  key={link.path}
                  className="sidebar-link"
                  onClick={() => {
                    navigate(link.path);
                    closeSidebar();
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {link.label}
                </span>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
