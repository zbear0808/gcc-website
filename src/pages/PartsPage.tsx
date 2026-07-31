import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fullCatalog } from '@shared/catalog';
import { formatPrice } from '@shared/pricing';
import '@/assets/styles/pages/parts.css';

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
      const category = fullCatalog.find(c => c.subtypes.some(i => i.id === id));
      const item = category?.subtypes.find(i => i.id === id);
      if (item) {
        total += (item.price || 0) * qty;
      }
    });
    return total;
  };

  const renderCategory = (category: typeof fullCatalog[0]) => {
    const validPrices = category.subtypes.map(i => i.individualPrice ?? i.price ?? 0).filter(p => p > 0);
    const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
    const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;
    
    let priceDisplay = '';
    if (validPrices.length === 0) {
      priceDisplay = 'Not available individually';
    } else {
      priceDisplay = minPrice === maxPrice ? `$${minPrice}` : `From $${minPrice}`;
    }

    return (
      <div key={category.id} className="catalog-card" onClick={() => navigate(`/product/${category.id}`)}>
        <img src={category.image} alt={category.label} />
        <div className="catalog-info">
          <h3>{category.label}</h3>
          <p className="price">{priceDisplay}</p>
        </div>
      </div>
    );
  };

  const electronicsIds = [
    'board-only', 'cables', 'rumble-motors', 'slider-pots', 'stickbox', 
    'stickbox-pot', 'magnet-mount', 'dh1212-magnet', '6-pin-ribbon-cable', 
    'trigger-paddle-pcbs'
  ];
  
  const shellsAndButtonsIds = [
    'shells', 'buttons', 'wii-caps', 'membranes', 'z-buttons'
  ];

  const electronics = fullCatalog.filter(c => electronicsIds.includes(c.id));
  const shellsAndButtons = fullCatalog.filter(c => shellsAndButtonsIds.includes(c.id));
  const others = fullCatalog.filter(c => !electronicsIds.includes(c.id) && !shellsAndButtonsIds.includes(c.id));

  return (
    <div className="parts-page">
      <h1>Parts & Components</h1>
      
      <h2>Shells & Buttons</h2>
      <div className="catalog-grid">
        {shellsAndButtons.map(renderCategory)}
      </div>

      <h2>Electronic Components & Internals</h2>
      <div className="catalog-grid">
        {electronics.map(renderCategory)}
      </div>

      {others.length > 0 && (
        <>
          <h2 style={{ marginTop: '3rem' }}>Other Parts</h2>
          <div className="catalog-grid">
            {others.map(renderCategory)}
          </div>
        </>
      )}

      <div className="cart-summary">
        <span>Total: ${formatPrice(cartTotal())}</span>
        <button onClick={() => navigate('/cart')}>View Cart</button>
      </div>
    </div>
  );
}
