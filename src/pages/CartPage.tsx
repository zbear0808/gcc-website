
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fullCatalog } from '@shared/catalog';
import { calculateTotal, getItem, formatPrice } from '@shared/pricing';
import '@/assets/styles/pages/cart.css';
import { TrashIcon } from '@/components/Icons';
import type { ConfiguratorState } from '@shared/types';

export const renderBuildOptions = (build: ConfiguratorState) => {
  const options: string[] = [];

  const keys = [
    { key: 'shell', label: 'Shell' },
    { key: 'buttons', label: 'Buttons' },
    { key: 'cable', label: 'Cable' },
    { key: 'rumble', label: 'Rumble' },
    { key: 'sliderPots', label: 'Slider Potentiometers' },
    { key: 'zButton', label: 'Z Button' },
    { key: 'membrane', label: 'Membranes' },
    { key: 'stickCap', label: 'Stick Cap' },
  ];

  keys.forEach(({ key, label }) => {
    const val = build[key as keyof ConfiguratorState];
    if (val && typeof val === 'string') {
      options.push(`${label}: ${getItem(val)?.label || val}`);
    }
  });

  if (build.notchesFirefox) options.push(`Notches: Firefox (${build.notchStyle || 'standard'})`);
  if (build.notchesWavedash) options.push(`Notches: Wavedash (${build.notchStyle || 'standard'})`);

  if (build.triggerPlugs) {
    const side = build.triggerPlugSide === 'l' ? 'Left' : build.triggerPlugSide === 'r' ? 'Right' : 'Both';
    const length = build.triggerPlugLength || 'short';
    options.push(`Trigger Plugs: ${side} (${length})`);
  }

  if (build.kailhChoco) {
    const side = build.kailhChocoSide === 'l' ? 'Left' : build.kailhChocoSide === 'r' ? 'Right' : 'Both';
    options.push(`kailh Choco Triggers: ${side}`);
  }

  if (build.springCut) options.push(`Spring Cut`);
  if (build.detachableTriggerPaddle) options.push(`Detachable Trigger Paddle Mod`);
  if (build.wornShell) options.push(`Worn Shell`);

  return options;
};

export default function CartPage() {
  const cart = useStore(state => state.cart);
  const customBuilds = useStore(state => state.customBuilds);
  const inventory = useStore(state => state.inventory);
  const updateCartQuantity = useStore(state => state.updateCartQuantity);
  const removeCustomBuild = useStore(state => state.removeCustomBuild);
  const clearCart = useStore(state => state.clearCart);
  
  const navigate = useNavigate();

  // Reconstruct individual items mapping for the cart
  const individualItems = fullCatalog.flatMap(category => category.subtypes);

  const cartItems = Object.entries(cart)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => {
      const itemDef = individualItems.find(i => i.id === id);
      return { id, qty, ...itemDef, displayPrice: itemDef?.individualPrice ?? itemDef?.price };
    })
    .filter(item => item.displayPrice !== undefined);

  const cartTotal = () => {
    let partsTotal = 0;
    if (typeof cartTotal === 'function') {
      partsTotal = cartTotal();
    } else {
      partsTotal = cartItems.reduce((acc, item) => acc + (item.displayPrice || 0) * item.qty, 0);
    }

    const buildsTotal = customBuilds?.reduce((sum, build) => sum + calculateTotal(build), 0) ?? 0;
    return partsTotal + buildsTotal;
  };

  const total = cartTotal();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cartItems.length === 0 && (!customBuilds || customBuilds.length === 0)) {
    return (
      <div className="cart-page empty">
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate('/parts')}>Browse Parts</button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h2 className="heading-ndot">Your Cart</h2>
      <div className="cart-items">
        {customBuilds?.map((build, idx) => {
          const product = getItem(build.product ?? '');
          const buildPrice = calculateTotal(build);
          return (
            <div key={`build-${idx}`} className="cart-item card-base">
              <div className="cart-item-info">
                <h3>{product?.label ?? 'Custom Build'}</h3>
                <p>Configured {build.product === 'full-build' ? 'Controller' : 'Kit'}</p>
                <p>${formatPrice(buildPrice)}</p>
                <ul className="cart-item-options">
                  {renderBuildOptions(build).map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
              </div>
              <div className="cart-controls">
                <button aria-label="Remove" onClick={() => removeCustomBuild(idx)}>
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}
        {cartItems.map(item => (
          <div key={item.id} className="cart-item card-base">
            <div className="cart-item-info">
              <h3>{item.label}</h3>
              <p>${item.displayPrice}</p>
            </div>
            <div className="cart-controls">
              <button onClick={() => updateCartQuantity(item.id, -1)}>-</button>
              <span>{item.qty}</span>
              <button
                onClick={() => updateCartQuantity(item.id, 1)}
                disabled={item.qty >= (inventory[item.id] || 0)}
              >+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-total">
        <h3>Total: ${formatPrice(total)}</h3>
      </div>
      <div className="cart-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button className="btn btn-outline" onClick={() => clearCart()}>
          Clear Cart
        </button>
        <button className="checkout-btn" onClick={handleCheckout} style={{ flex: 1 }}>
          Checkout
        </button>
      </div>
    </div>
  );
}

