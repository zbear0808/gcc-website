
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fullCatalog } from '@shared/catalog';
import { calculateTotal, getItem, formatPrice } from '@shared/pricing';
import '@/assets/styles/pages/cart.css';
import { TrashIcon } from '@/components/Icons';
import type { ConfiguratorState } from '@shared/types';

const renderBuildOptions = (build: ConfiguratorState) => {
  const options = [];

  if (build.shell) options.push(`Shell: ${getItem(build.shell)?.label || build.shell}`);
  if (build.buttons) options.push(`Buttons: ${getItem(build.buttons)?.label || build.buttons}`);
  if (build.cable) options.push(`Cable: ${getItem(build.cable)?.label || build.cable}`);
  if (build.rumble) options.push(`Rumble: ${getItem(build.rumble)?.label || build.rumble}`);
  if (build.sliderPots) options.push(`Slider Pots: ${getItem(build.sliderPots)?.label || build.sliderPots}`);
  if (build.zButton) options.push(`Z Button: ${getItem(build.zButton)?.label || build.zButton}`);
  if (build.membrane) options.push(`Membranes: ${getItem(build.membrane)?.label || build.membrane}`);
  if (build.stickCap) options.push(`Stick Cap: ${getItem(build.stickCap)?.label || build.stickCap}`);

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
  const store = useStore();
  const navigate = useNavigate();

  // Reconstruct individual items mapping for the cart
  const individualItems = fullCatalog.flatMap(category => category.subtypes);

  const cartItems = Object.entries(store.cart)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => {
      const itemDef = individualItems.find(i => i.id === id);
      return { id, qty, ...itemDef, displayPrice: itemDef?.individualPrice ?? itemDef?.price };
    })
    .filter(item => item.displayPrice !== undefined);

  const cartTotal = () => {
    let partsTotal = 0;
    // @ts-ignore: if cartTotal exists on store, use it, else compute manually
    if (typeof store.cartTotal === 'function') {
      partsTotal = store.cartTotal();
    } else {
      partsTotal = cartItems.reduce((acc, item) => acc + (item.displayPrice || 0) * item.qty, 0);
    }

    const buildsTotal = store.customBuilds?.reduce((sum, build) => sum + calculateTotal(build), 0) ?? 0;
    return partsTotal + buildsTotal;
  };

  const total = cartTotal();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cartItems.length === 0 && (!store.customBuilds || store.customBuilds.length === 0)) {
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
        {store.customBuilds?.map((build, idx) => {
          const product = getItem(build.product ?? '');
          const buildPrice = calculateTotal(build);
          return (
            <div key={`build-${idx}`} className="cart-item">
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
                <button aria-label="Remove" onClick={() => store.removeCustomBuild(idx)}>
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}
        {cartItems.map(item => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-info">
              <h3>{item.label}</h3>
              <p>${item.displayPrice}</p>
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
        <h3>Total: ${formatPrice(total)}</h3>
      </div>
      <div className="cart-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button className="clear-cart-btn" onClick={() => store.clearCart()} style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer' }}>
          Clear Cart
        </button>
        <button className="checkout-btn" onClick={handleCheckout} style={{ flex: 1 }}>
          Checkout
        </button>
      </div>
    </div>
  );
}
