import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';

import ShopPage from '@/pages/ShopPage';
import PartsPage from '@/pages/PartsPage';
import FaqPage from '@/pages/FaqPage';
import ProductPage from '@/pages/ProductPage';
import CartPage from '@/pages/CartPage';
import AdminPage from '@/pages/AdminPage';
import CheckoutPage from '@/pages/CheckoutPage';

const RouteTitleHandler = () => {
  const location = useLocation();

  useEffect(() => {
    let title = 'GCC Shop';
    switch (location.pathname) {
      case '/':
        title = 'GCC Shop | Builds';
        break;
      case '/parts':
        title = 'GCC Shop | Parts';
        break;
      case '/faq':
        title = 'GCC Shop | FAQ';
        break;
      case '/cart':
        title = 'GCC Shop | Cart';
        break;
      case '/checkout':
        title = 'GCC Shop | Checkout';
        break;
      case '/admin':
        title = 'GCC Shop | Admin';
        break;
      default:
        if (location.pathname.startsWith('/product/')) {
          title = 'GCC Shop | Product';
        }
        break;
    }
    document.title = title;
  }, [location.pathname]);

  return null;
};

const App: React.FC = () => {
  const loadInventory = useStore((state) => state.loadInventory);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  return (
    <BrowserRouter>
      <div className="app-container">
        <RouteTitleHandler />
        <Header />
        <main className="main-content">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<ShopPage />} />
              <Route path="/parts" element={<PartsPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
