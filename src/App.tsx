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

/** Map a route pathname to the appropriate page title. */
export function getRouteTitle(pathname: string): string {
  switch (pathname) {
    case '/':
      return 'Zu Builds | Builds';
    case '/parts':
      return 'Zu Builds | Parts';
    case '/faq':
      return 'Zu Builds | FAQ';
    case '/cart':
      return 'Zu Builds | Cart';
    case '/checkout':
      return 'Zu Builds | Checkout';
    case '/admin':
      return 'Zu Builds | Admin';
    default:
      if (pathname.startsWith('/product/')) {
        return 'Zu Builds | Product';
      }
      return 'Zu Builds';
  }
}

const RouteTitleHandler = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = getRouteTitle(location.pathname);
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
