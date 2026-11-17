import { Link, useNavigate } from 'react-router-dom';
import { useStore, useCartTotal } from '@/store/useStore';
import { fullCatalog } from '@shared/catalog';
import { calculateTotal, getItem, formatPrice } from '@shared/pricing';
import { CartIcon, TrashIcon } from '@/components/Icons';
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
    options.push(`Kailh Choco Triggers: ${side}`);
  }

  if (build.springCut) options.push(`Spring Cut`);
  if (build.detachableTriggerPaddle) options.push(`Detachable Trigger Paddle Mod`);
  if (build.wornShell) options.push(`Worn Shell`);

  return options;
};

export default function CartPage() {
  const cart = useStore((state) => state.cart);
  const customBuilds = useStore((state) => state.customBuilds);
  const inventory = useStore((state) => state.inventory);
  const updateCartQuantity = useStore((state) => state.updateCartQuantity);
  const removeCustomBuild = useStore((state) => state.removeCustomBuild);
  const clearCart = useStore((state) => state.clearCart);
  const total = useCartTotal();
  const navigate = useNavigate();

  const individualItems = fullCatalog.flatMap((category) => category.subtypes);

  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const itemDef = individualItems.find((i) => i.id === id);
      return { id, qty, ...itemDef, displayPrice: itemDef?.individualPrice ?? itemDef?.price };
    })
    .filter((item) => item.displayPrice !== undefined);

  if (cartItems.length === 0 && (!customBuilds || customBuilds.length === 0)) {
    return (
      <div className="page page-narrow cart-page cart-empty">
        <CartIcon className="cart-empty-icon" />
        <h1 className="page-title">Your cart is empty</h1>
        <p className="page-intro">Configure a controller or grab some parts for your own build.</p>
        <div className="cart-empty-actions">
          <Link to="/" className="btn btn-go">
            Build a controller
          </Link>
          <Link to="/parts" className="btn btn-outline">
            Browse parts
          </Link>
        </div>
      </div>
    );
  }

  const itemCount = cartItems.reduce((sum, i) => sum + i.qty, 0) + (customBuilds?.length ?? 0);

  const confirmClear = () => {
    if (window.confirm('Remove everything from your cart?')) clearCart();
  };

  return (
    <div className="page cart-page">
      <h1 className="page-title">Cart</h1>
      <p className="cart-count">
        {itemCount} {itemCount === 1 ? 'item' : 'items'}
      </p>

      <div className="cart-layout">
        <div className="cart-items">
          {customBuilds?.map((build, idx) => {
            const product = getItem(build.product ?? '');
            const options = renderBuildOptions(build);
            return (
              <article key={`build-${idx}`} className="cart-item cart-build">
                <div className="cart-item-main">
                  <div className="cart-item-header">
                    <div>
                      <h2>{product?.label ?? 'Custom build'}</h2>
                      <span className="cart-item-kind">
                        Custom {build.product === 'full-build' ? 'controller' : 'kit'}
                      </span>
                    </div>
                    <span className="cart-item-price">${formatPrice(calculateTotal(build))}</span>
                  </div>
                  {options.length > 0 && (
                    <ul className="cart-item-options">
                      {options.map((opt, i) => {
                        const [label, ...rest] = opt.split(': ');
                        return (
                          <li key={i}>
                            {rest.length > 0 ? (
                              <>
                                <span>{label}</span> {rest.join(': ')}
                              </>
                            ) : (
                              opt
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <button className="icon-btn cart-remove" aria-label="Remove build" onClick={() => removeCustomBuild(idx)}>
                  <TrashIcon />
                </button>
              </article>
            );
          })}

          {cartItems.map((item) => (
            <article key={item.id} className="cart-item">
              <div className="cart-item-main">
                <div className="cart-item-header">
                  <div>
                    <h2>{item.label}</h2>
                    <span className="cart-item-kind">${formatPrice(item.displayPrice ?? 0)} each</span>
                  </div>
                  <span className="cart-item-price">${formatPrice((item.displayPrice ?? 0) * item.qty)}</span>
                </div>
                <div className="cart-controls" aria-label={`Quantity of ${item.label}`}>
                  <button onClick={() => updateCartQuantity(item.id, -1)} aria-label="Decrease quantity">
                    −
                  </button>
                  <span>{item.qty}</span>
                  <button
                    onClick={() => updateCartQuantity(item.id, 1)}
                    disabled={item.qty >= (inventory[item.id] || 0)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="cart-summary-panel">
          <h2 className="cart-summary-title">Summary</h2>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>${formatPrice(total)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>Calculated at checkout</dd>
            </div>
          </dl>
          <button className="btn btn-go btn-lg btn-block" onClick={() => navigate('/checkout')}>
            Checkout
          </button>
          <p className="cart-summary-note">
            USPS, cheapest option I can get. Questions about returns or warranty? See the <Link to="/faq">FAQ</Link>.
          </p>
          <button className="btn btn-ghost cart-clear" onClick={confirmClear}>
            Clear cart
          </button>
        </aside>
      </div>
    </div>
  );
}
