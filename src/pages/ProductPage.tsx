import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fullCatalog } from '@shared/catalog';
import '@/assets/styles/product.css';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useStore();
  
  const category = fullCatalog.find(c => c.id === id);
  const [selectedItem, setSelectedItem] = useState(category?.items[0]?.id || '');
  
  if (!category) return <div>Product not found</div>;

  const item = category.items.find(i => i.id === selectedItem) || category.items[0];
  const stock = store.inventory[item.id] || 0;
  const inCart = store.cart[item.id] || 0;

  const handleAdd = () => {
    if (stock > inCart) {
      store.addToCart(item.id);
    }
  };

  return (
    <div className="product-page">
      <button className="back-link" onClick={() => navigate('/parts')}>Back to Parts</button>
      <div className="product-details">
        {/* @ts-ignore - Assuming image might be on item or category */}
        <img src={item.image || category.image} alt={item.label} />
        <div className="product-info">
          <h2>{category.label}</h2>
          <p>{category.description}</p>
          
          {category.items.length > 1 && (
            <select 
              value={selectedItem} 
              onChange={(e) => setSelectedItem(e.target.value)}
            >
              {category.items.map(subItem => (
                <option key={subItem.id} value={subItem.id}>
                  {subItem.label} - ${subItem.price}
                </option>
              ))}
            </select>
          )}

          <div className="price">${item.price}</div>
          <div className="stock">
            {stock > 0 ? `${stock} in stock` : 'Out of stock'}
          </div>

          <div className="cart-controls">
            <button onClick={() => store.updateCartQuantity(item.id, -1)} disabled={inCart === 0}>-</button>
            <span>{inCart} in cart</span>
            <button onClick={handleAdd} disabled={inCart >= stock || stock === 0}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
}
