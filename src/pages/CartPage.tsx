import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fullCatalog } from '@shared/catalog';
import '@/assets/styles/cart.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function CartPage() {
  const store = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Reconstruct individual items mapping for the cart
  const individualItems = fullCatalog.flatMap(category => category.items);

  const cartItems = Object.entries(store.cart)
    .filter(([id, qty]) => qty > 0)
    .map(([id, qty]) => {
      const itemDef = individualItems.find(i => i.id === id);
      return { id, qty, ...itemDef };
    })
    .filter(item => item.price !== undefined);

  const cartTotal = () => {
    // @ts-ignore: if cartTotal exists on store, use it, else compute manually
    if (typeof store.cartTotal === 'function') {
      return store.cartTotal();
    }
    return cartItems.reduce((acc, item) => acc + (item.price || 0) * item.qty, 0);
  };
  
  const total = cartTotal();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parts: true,
          cart: store.cart,
        }),
      });
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        alert('Checkout failed');
      }
    } catch (e) {
      console.error(e);
      alert('Checkout error');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page empty">
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate('/parts')}>Browse Parts</button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h2>Your Cart</h2>
      <div className="cart-items">
        {cartItems.map(item => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-info">
              <h3>{item.label}</h3>
              <p>${item.price}</p>
            </div>
            <div className="cart-controls">
              <button onClick={() => store.updateCartQuantity(item.id, -1)}>-</button>
              <span>{item.qty}</span>
              <button 
                onClick={() => store.updateCartQuantity(item.id, 1)}
                disabled={item.qty >= (store.inventory[item.id] || 0)}
              >+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-total">
        <h3>Total: ${total.toFixed(2)}</h3>
      </div>
      <button className="checkout-btn" onClick={handleCheckout} disabled={loading}>
        {loading ? 'Processing...' : 'Checkout'}
      </button>
    </div>
  );
}
