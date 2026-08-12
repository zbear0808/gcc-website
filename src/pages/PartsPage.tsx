import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fullCatalog } from '@shared/catalog';
import { formatPrice } from '@shared/pricing';
import '@/assets/styles/pages/parts.css';

const CollapsibleSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="collapsible-section">
      <h2
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', userSelect: 'none' }}
      >
        <span style={{ fontSize: '0.6em', transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
        {title}
      </h2>
      {isOpen && (
        <div className="catalog-grid">
          {children}
        </div>
      )}
    </div>
  );
};


export default function PartsPage() {
  const navigate = useNavigate();
  const store = useStore();

  const cartTotal = () => {
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

      <CollapsibleSection title="Cosmetic Parts">
        {shellsAndButtons.map(renderCategory)}
      </CollapsibleSection>

      <CollapsibleSection title="Stickbox Parts">
        {stickboxes.map(renderCategory)}
      </CollapsibleSection>

      <CollapsibleSection title="Electronic Parts">
        {electronics.map(renderCategory)}
      </CollapsibleSection>

      <CollapsibleSection title="Mechanical Trigger Mod">
        {mechanicalTriggers.map(renderCategory)}
      </CollapsibleSection>

      {others.length > 0 && (
        <CollapsibleSection title="Other Parts">
          {others.map(renderCategory)}
        </CollapsibleSection>
      )}

      <div className="cart-summary">
        <span>Total: ${formatPrice(cartTotal())}</span>
        <button onClick={() => navigate('/cart')}>View Cart</button>
      </div>
    </div>
  );
}
