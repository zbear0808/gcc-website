import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { products, shells, buttons, cables, rumbles, sliderPots, zButtons, rubberMembranes, mods, triggers } from '@shared/catalog';
import { calculateTotal } from '@shared/pricing';
import { TriggerSide } from '@shared/types';
import ControllerVisualizer from '@/components/ControllerVisualizer';
import ConfigSection from '@/components/ConfigSection';
import '@/assets/styles/shop.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function ShopPage() {
  const store = useStore();
  const [loading, setLoading] = useState(false);

  const { config } = store;
  const isFullBuild = config.product === 'full-build';
  const isDIY = config.product === 'diy-kit' || config.product === '0-solder';
  const isBoardOnly = config.product === 'board-only';

  const oemShells = shells.filter(s => s.type === 'oem');
  const extremerateShells = shells.filter(s => s.type === 'extremerate');

  const oemButtons = buttons.filter(b => b.type === 'oem');
  const extremerateButtons = buttons.filter(b => b.type === 'extremerate');
  const resinButtons = buttons.filter(b => b.type === 'resin');
  const baldButtons = buttons.filter(b => b.type === 'bald');

  const selectedShell = shells.find(s => s.id === config.shell);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          cart: store.cart,
          parts: Object.keys(store.cart).length > 0 ? true : undefined
        }),
      });
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        alert('Checkout failed');
      }
    } catch (e) {
      console.error(e);
      alert('Checkout error');
    } finally {
      setLoading(false);
    }
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
            {products.map(p => (
              <button
                key={p.id}
                className={`product-btn ${config.product === p.id ? 'active' : ''}`}
                onClick={() => store.setProduct(p.id)}
              >
                <div className="product-btn-label">{p.label}</div>
                <div className="product-btn-price">${p.basePrice}</div>
                <div className="product-btn-desc">{p.description}</div>
              </button>
            ))}
          </div>

          {!isBoardOnly && (
            <>
              {isFullBuild && (
                <>
                  <ConfigSection
                    title="Shell (OEM)"
                    items={oemShells}
                    selectedId={config.shell}
                    onSelect={store.setShell}
                  />
                  <ConfigSection
                    title="Shell (Extremerate)"
                    items={extremerateShells}
                    selectedId={config.shell}
                    onSelect={store.setShell}
                  />

                  <ConfigSection title="Buttons (OEM)" items={oemButtons} selectedId={config.buttons} onSelect={store.setButtons} />
                  <ConfigSection title="Buttons (Extremerate)" items={extremerateButtons} selectedId={config.buttons} onSelect={store.setButtons} />
                  <ConfigSection title="Buttons (Resin)" items={resinButtons} selectedId={config.buttons} onSelect={store.setButtons} />
                  <ConfigSection title="Buttons (Bald)" items={baldButtons} selectedId={config.buttons} onSelect={store.setButtons} />
                </>
              )}

              <ConfigSection
                title="Cable"
                items={cables}
                selectedId={config.cable}
                onSelect={store.setCable}
                disabledFn={(item) => item.id === 'oem-cable' && (isDIY || selectedShell?.type !== 'oem')}
              />

              {isFullBuild && (
                <ConfigSection
                  title="Rumble Motor"
                  items={rumbles}
                  selectedId={config.rumble}
                  onSelect={store.setRumble}
                />
              )}

              <ConfigSection
                title="Slider Pots"
                items={sliderPots}
                selectedId={config.sliderPots}
                onSelect={store.setSliderPots}
              />
              <ConfigSection
                title="Z Button"
                items={zButtons}
                selectedId={config.zButton}
                onSelect={store.setZButton}
              />
              <ConfigSection
                title="Rubber Membranes"
                items={rubberMembranes}
                selectedId={config.membrane}
                onSelect={store.setMembrane}
              />

              {isFullBuild && (
                <>
                  <div className="config-section mods-section">
                    <h3>Modifications</h3>
                    {mods.map(m => (
                      <button
                        key={m.id}
                        className={`mod-btn ${config.mods.includes(m.id) ? 'active' : ''}`}
                        onClick={() => store.toggleMod(m.id)}
                      >
                        {m.label} (+${m.price})
                      </button>
                    ))}
                  </div>

                  {config.mods.includes('trigger-plugs') && (
                    <div className="config-section triggers-section">
                      <h3>Trigger Side</h3>
                      {triggers.map(t => (
                        <button
                          key={t.id}
                          className={`trigger-btn ${config.triggerSide === t.id ? 'active' : ''}`}
                          onClick={() => store.setTriggerSide(t.id as TriggerSide)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          <div className="price-breakdown">
            <h3>Total: ${calculateTotal(config)}</h3>
          </div>

          <button
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Build It'}
          </button>
        </div>
      </div>
    </div>
  );
}
