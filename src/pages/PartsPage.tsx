import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fullCatalog } from '@shared/catalog';
import '@/assets/styles/parts.css';

export default function PartsPage() {
  const navigate = useNavigate();
  const store = useStore();
  
  const cartTotal = () => {
    // @ts-ignore: if cartTotal exists on store, use it, else compute manually
    if (typeof store.cartTotal === 'function') {
      return store.cartTotal();
    }
    let total = 0;
    Object.entries(store.cart).forEach(([id, qty]) => {
      const category = fullCatalog.find(c => c.items.some(i => i.id === id));
      const item = category?.items.find(i => i.id === id);
      if (item) {
        total += (item.price || 0) * qty;
      }
    });
    return total;
  };

  return (
    <div className="parts-page">
      <h1>Parts & Components</h1>
      <div className="catalog-grid">
        {fullCatalog.map(category => {
          const prices = category.items.map(i => i.price || 0);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const priceDisplay = minPrice === maxPrice ? `$${minPrice}` : `From $${minPrice}`;

          return (
            <div key={category.id} className="catalog-card" onClick={() => navigate(`/product/${category.id}`)}>
              <img src={category.image} alt={category.label} />
              <div className="catalog-info">
                <h3>{category.label}</h3>
                <p className="price">{priceDisplay}</p>
                <p>{category.description}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="cart-summary">
        <span>Total: ${cartTotal().toFixed(2)}</span>
        <button onClick={() => navigate('/cart')}>View Cart</button>
      </div>
    </div>
  );
}
