import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { products, shells, buttons, cables, rumbles, sliderPots, zButtons, membranes, mods, addons, stickCaps } from '@shared/catalog';
import { calculateTotal, getItemPrice } from '@shared/pricing';
import type { TriggerSide } from '@shared/types';
import ControllerVisualizer from '@/components/ControllerVisualizer';
import ConfigSection from '@/components/ConfigSection';
import '@/assets/styles/pages/shop.css';

const triggers = [
  { id: 'l', label: 'Left Only' },
  { id: 'r', label: 'Right Only' },
  { id: 'both', label: 'Both' },
];

export default function ShopPage() {
  const store = useStore();

  const { config } = store;
  const isFullBuild = config.product === 'full-build';
  const isDIY = config.product === 'diy-kit' || config.product === '0-solder-diy-kit';

  const oemShells = shells.filter(s => s.type === 'oem');
  const extremerateShells = shells.filter(s => s.type === 'extremerate');

  const oemButtons = buttons.filter(b => b.type === 'oem');
  const extremerateButtons = buttons.filter(b => b.type === 'extremerate');

  const selectedShell = shells.find(s => s.id === config.shell);

  const navigate = useNavigate();

  const handleAddToCart = () => {
    store.addCustomBuild(store.config);
    // Reset to default config for a fresh build if they come back
    store.setConfig(() => ({ product: 'full-build' }));
    navigate('/cart');
  };

  return (
    <div className="shop-page">
      <div className="shop-layout">
        <div className="visualizer-col">
          <ControllerVisualizer />
        </div>
        <div className="config-panel">
          <h2>Select Product</h2>
          <div className="product-selector">
            {products.filter(p => p.id !== 'board-only').map(p => (
              <button
                key={p.id}
                className={`product-btn ${config.product === p.id ? 'active' : ''}`}
                onClick={() => store.setProduct(p.id)}
              >
                <div className="product-btn-label">{p.label}</div>
                <div className="product-btn-price">${p.price}</div>
                {config.product === p.id && (
                  <div className="product-btn-desc">{p.description}</div>
                )}
              </button>
            ))}
          </div>

          <>
            {isFullBuild && (
              <>
                <ConfigSection
                  title="Shell (OEM)"
                  items={oemShells}
                  selectedId={config.shell}
                  onSelect={store.setShell}
                  basePrice={getItemPrice(config.shell ?? '')}
                />

                {['indigo', 'black', 'platinum'].includes(config.shell ?? '') && (
                  <div className="config-section" style={{ marginTop: '-1rem', marginBottom: '2rem' }}>
                    <button
                      className={`mod-btn ${config.wornShell ? 'active' : ''}`}
                      onClick={() => store.toggleMod('wornShell')}
                    >
                      Use Heavily Worn Shell <span className="price-decrease">(-$4.00)</span>
                    </button>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                      Opt for a heavily worn shell (significant scratches/scuffs, but no cracks) for a discount.
                    </p>
                  </div>
                )}
                <ConfigSection
                  title="Shell (Extremerate)"
                  items={extremerateShells}
                  selectedId={config.shell}
                  onSelect={store.setShell}
                  basePrice={getItemPrice(config.shell ?? '')}
                />

                <ConfigSection title="Buttons (OEM)" items={oemButtons} selectedId={config.buttons} onSelect={store.setButtons} basePrice={getItemPrice(config.buttons ?? '')} />
                <ConfigSection title="Buttons (Extremerate)" items={extremerateButtons} selectedId={config.buttons} onSelect={store.setButtons} basePrice={getItemPrice(config.buttons ?? '')} />

                <ConfigSection
                  title="Rubber Membranes"
                  items={membranes}
                  selectedId={config.membrane}
                  onSelect={store.setMembrane}
                  basePrice={getItemPrice(config.membrane ?? '')}
                />
              </>
            )}

            <ConfigSection
              title="Cable"
              items={cables}
              selectedId={config.cable}
              onSelect={store.setCable}
              disabledFn={(item) => item.id === 'oem-cable' && (isDIY || selectedShell?.type !== 'oem')}
              basePrice={getItemPrice(config.cable ?? '')}
            />

            {config.cable === 'cable-oem' && (
              <div className="oem-warning">
                <strong>Please Note:</strong> While we rigorously test all full controller builds, we cannot test the durability of salvaged OEM parts. There is no warranty on OEM cables, so we recommend purchasing a new backup cable.
              </div>
            )}

            {isFullBuild && (
              <ConfigSection
                title="Rumble Motor"
                items={rumbles}
                selectedId={config.rumble}
                onSelect={store.setRumble}
                basePrice={getItemPrice(config.rumble ?? '')}
              />
            )}

            <ConfigSection
              title="Slider Pots"
              items={sliderPots}
              selectedId={config.sliderPots}
              onSelect={store.setSliderPots}
              basePrice={getItemPrice(config.sliderPots ?? '')}
            />
            <ConfigSection
              title="Z Button"
              items={zButtons}
              selectedId={config.zButton}
              onSelect={store.setZButton}
              basePrice={getItemPrice(config.zButton ?? '')}
            />
            <ConfigSection
              title="Stick Caps"
              items={stickCaps}
              selectedId={config.stickCap}
              onSelect={store.setStickCap}
              basePrice={getItemPrice(config.stickCap ?? '')}
            />

            {isFullBuild && (
              <>
                <div className="config-section mods-section">
                  <h3>Modifications</h3>
                  {mods.map(m => (
                    <button
                      key={m.id}
                      className={`mod-btn ${config[m.id as keyof typeof config] ? 'active' : ''}`}
                      onClick={() => store.toggleMod(m.id)}
                    >
                      {m.label} <span className="price-increase">(+${m.price})</span>
                    </button>
                  ))}
                  {addons.map(a => {
                    let displayPrice = a.price;
                    if (a.id === 'kalihChoco') {
                      displayPrice = (config.kalihChocoSide ?? 'both') === 'both' ? 40 : 30;
                    }
                    return (
                      <button
                        key={a.id}
                        className={`mod-btn ${config[a.id as keyof typeof config] ? 'active' : ''}`}
                        onClick={() => store.toggleMod(a.id)}
                      >
                        {a.label} {displayPrice ? <span className="price-increase">{`(+$${displayPrice})`}</span> : ''}
                      </button>
                    );
                  })}
                </div>

                {(config.notchesFirefox || config.notchesWavedash) && (
                  <div className="config-section triggers-section">
                    <h3>Notch Style</h3>
                    <button
                      className={`trigger-btn ${config.notchStyle === 'deep' || !config.notchStyle ? 'active' : ''}`}
                      onClick={() => store.setNotchStyle('deep')}
                    >
                      Deep Grooves (Default)
                    </button>
                    <button
                      className={`trigger-btn ${config.notchStyle === 'subtle' ? 'active' : ''}`}
                      onClick={() => store.setNotchStyle('subtle')}
                    >
                      Subtle Notches <span className="price-increase">(+$15.00)</span>
                    </button>
                  </div>
                )}

                {config.triggerPlugs && (
                  <>
                    <div className="config-section triggers-section">
                      <h3>Trigger Side</h3>
                      {triggers.map(t => (
                        <button
                          key={t.id}
                          className={`trigger-btn ${config.triggerPlugSide === t.id ? 'active' : ''}`}
                          onClick={() => store.setTriggerSide(t.id as TriggerSide)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <div className="config-section triggers-section" style={{ marginTop: '1rem' }}>
                      <h3>Trigger Plug Length</h3>
                      <button
                        className={`trigger-btn ${config.triggerPlugLength === 'tall' || !config.triggerPlugLength ? 'active' : ''}`}
                        onClick={() => store.setTriggerLength('tall')}
                      >
                        Tall
                      </button>
                      <button
                        className={`trigger-btn ${config.triggerPlugLength === 'short' ? 'active' : ''}`}
                        onClick={() => store.setTriggerLength('short')}
                      >
                        Short
                      </button>
                    </div>
                  </>
                )}

                {config.kalihChoco && (
                  <>
                    <div className="config-section triggers-section">
                      <h3>Kalih Choco Side</h3>
                      {triggers.map(t => (
                        <button
                          key={t.id}
                          className={`trigger-btn ${config.kalihChocoSide === t.id || (!config.kalihChocoSide && t.id === 'both') ? 'active' : ''}`}
                          onClick={() => store.setKalihChocoSide(t.id as TriggerSide)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>

          <div className="price-breakdown">
            <h3>Total: ${calculateTotal(config)}</h3>
          </div>

          <button
            className="checkout-btn"
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
