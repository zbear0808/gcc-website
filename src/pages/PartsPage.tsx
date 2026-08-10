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

    const totalStock = category.subtypes.reduce((sum, item) => sum + (store.inventory[item.id] || 0), 0);

    return (
      <div key={category.id} className="catalog-card" onClick={() => navigate(`/product/${category.id}`)}>
        <img src={category.image} alt={category.label} />
        <div className="catalog-info">
          <h3>{category.label}</h3>
          <div className="catalog-info-bottom">
            <p className="price">{priceDisplay}</p>
            {totalStock <= 0 ? (
              <span className="out-of-stock">Out of stock</span>
            ) : totalStock <= 10 ? (
              <span className="low-stock">Low stock</span>
            ) : (
              <span className="stock-count">In stock</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const electronicsIds = [
    'board-only', 'board-oem', 'cables', 'rumble-motors', 'slider-pots', '6-pin-ribbon-cable', 
    'trigger-paddle-pcbs', 'z-buttons'
  ];
  
  const shellsAndButtonsIds = [
    'shells', 'buttons', 'wii-caps', 'membranes', 'stick-caps'
  ];

  const mechanicalTriggerIds = [
    'switch-kailh-choco', 'jst-pigtail-header', 'switch-mount-3d'
  ];

  const stickboxIds = [
    'stickbox', 'stickbox-t1-t2', 'magnet-mount', 'dh1212-magnet', 'stickbox-pot'
  ];

  const electronics = fullCatalog.filter(c => electronicsIds.includes(c.id));
  const shellsAndButtons = fullCatalog.filter(c => shellsAndButtonsIds.includes(c.id));
  const mechanicalTriggers = fullCatalog.filter(c => mechanicalTriggerIds.includes(c.id));
  const stickboxes = fullCatalog.filter(c => stickboxIds.includes(c.id));
  const others = fullCatalog.filter(c => 
    !electronicsIds.includes(c.id) && 
    !shellsAndButtonsIds.includes(c.id) &&
    !mechanicalTriggerIds.includes(c.id) &&
    !stickboxIds.includes(c.id)
  );

  return (
    <div className="parts-page">
      <h1>Parts & Components</h1>
      
      <h2>Cosmetic Parts</h2>
      <div className="catalog-grid">
        {shellsAndButtons.map(renderCategory)}
      </div>

      <h2>Stickbox Parts</h2>
      <div className="catalog-grid">
        {stickboxes.map(renderCategory)}
      </div>

      <h2>Electronic Parts</h2>
      <div className="catalog-grid">
        {electronics.map(renderCategory)}
      </div>

      <h2>Mechanical Trigger Mod</h2>
      <div className="catalog-grid">
        {mechanicalTriggers.map(renderCategory)}
      </div>

      {others.length > 0 && (
        <>
          <h2>Other Parts</h2>
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
