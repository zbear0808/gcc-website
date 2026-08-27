import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
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

const Layout = () => {
  const loadInventory = useStore((state) => state.loadInventory);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <>
            <title>Zu Builds | Builds</title>
            <ShopPage />
          </>
        ),
      },
      {
        path: 'parts',
        element: (
          <>
            <title>Zu Builds | Parts</title>
            <PartsPage />
          </>
        ),
      },
      {
        path: 'faq',
        element: (
          <>
            <title>Zu Builds | FAQ</title>
            <FaqPage />
          </>
        ),
      },
      {
        path: 'product/:id',
        element: (
          <>
            <title>Zu Builds | Product</title>
            <ProductPage />
          </>
        ),
      },
      {
        path: 'cart',
        element: (
          <>
            <title>Zu Builds | Cart</title>
            <CartPage />
          </>
        ),
      },
      {
        path: 'checkout',
        element: (
          <>
            <title>Zu Builds | Checkout</title>
            <CheckoutPage />
          </>
        ),
      },
      {
        path: 'admin',
        element: (
          <>
            <title>Zu Builds | Admin</title>
            <AdminPage />
          </>
        ),
      },
    ],
  },
]);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
