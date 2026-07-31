import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fullCatalog } from '@shared/catalog';
import '@/assets/styles/pages/product.css';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useStore();
  
  const category = fullCatalog.find(c => c.id === id);
  const [selectedItem, setSelectedItem] = useState(category?.subtypes[0]?.id || '');
  
  if (!category) return <div>Product not found</div>;

  const item = category.subtypes.find(i => i.id === selectedItem) || category.subtypes[0];
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
          
          {category.subtypes.length > 1 && (
            <select 
              value={selectedItem} 
              onChange={(e) => setSelectedItem(e.target.value)}
            >
              {category.subtypes.map(subItem => {
                const displayPrice = subItem.individualPrice ?? subItem.price ?? 0;
                return (
                  <option key={subItem.id} value={subItem.id}>
                    {subItem.label} - ${displayPrice}
                  </option>
                );
              })}
            </select>
          )}

          <div className="price">${item.individualPrice ?? item.price ?? 0}</div>
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
