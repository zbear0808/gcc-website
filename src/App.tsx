import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Placeholders for page components
const ShopPage = () => <div>Shop</div>;
const PartsPage = () => <div>Parts</div>;
const FaqPage = () => <div>FAQ</div>;
const ProductPage = () => <div>Product</div>;
const CartPage = () => <div>Cart</div>;
const AdminPage = () => <div>Admin</div>;

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
          <Routes>
            <Route path="/" element={<ShopPage />} />
            <Route path="/parts" element={<PartsPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
