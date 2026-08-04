import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { products, shells, buttons, cables, rumbles, sliderPots, zButtons, membranes, mods, addons, stickCaps } from '@shared/catalog';
import { calculateTotal, getItemPrice } from '@shared/pricing';
import type { TriggerSide } from '@shared/types';
import ControllerVisualizer from '@/components/ControllerVisualizer';
import ConfigSection from '@/components/ConfigSection';
import VariantSelector from '@/components/VariantSelector';
import '@/assets/styles/pages/shop.css';

const triggers = [
  { id: 'l', label: 'Left Only', price: 0 },
  { id: 'r', label: 'Right Only', price: 0 },
  { id: 'both', label: 'Both', price: 0 },
];

const shellFacets = [
  { key: 'brand', label: 'Brand', getValue: (s: any) => s.type === 'oem' ? 'Nintendo (OEM)' : 'Extremerate' },
  { key: 'color', label: 'Color/Style', getValue: (s: any) => s.label }
];

const buttonFacets = [
  { key: 'brand', label: 'Brand', getValue: (b: any) => b.type === 'oem' ? 'Nintendo (OEM)' : 'Extremerate' },
  { key: 'color', label: 'Color', getValue: (b: any) => b.label.replace(' Buttons', '').replace(' Button', '') }
];

const stickCapFacets = [
  {
    key: 'brand',
    label: 'Brand',
    getValue: (c: any) => {
      if (c.id.includes('extremerate')) return 'Extremerate';
      if (c.id.includes('jcd')) return 'JCD';
      if (c.id.includes('3rd-party')) return 'Other 3rd Party';
      return 'Nintendo (OEM)';
    }
  },
  {
    key: 'type',
    label: 'Type',
    getValue: (c: any) => {
      if (!c.id.startsWith('gc-cap') && !c.id.startsWith('wii-cap')) return null;
      if (c.id.includes('gc-cap')) return 'GameCube';
      if (c.id.includes('wii-cap')) return 'Wii';
      return null;
    }
  },
  {
    key: 'color',
    label: 'Color',
    getValue: (c: any) => {
      if (!c.id.startsWith('gc-cap') && !c.id.startsWith('wii-cap')) return null;
      if (c.id.includes('tpu')) return null;
      if (c.id.includes('black')) return 'Black';
      if (c.id.includes('wii-cap')) return 'White';
      if (c.id.includes('gc-cap')) return 'Grey';
      return null;
    }
  },
  {
    key: 'variant',
    label: 'Variant',
    getValue: (c: any) => {
      if (c.id.includes('tpu')) return 'TPU Top';
      if (c.id.includes('gc-cap')) return 'Standard';
      return null;
    }
  },
  {
    key: 'condition',
    label: 'Condition',
    getValue: (c: any) => {
      if (c.id.includes('good')) return 'Good';
      if (c.id.includes('okay')) return 'Okay';
      if (c.id.includes('poor')) return 'Poor';
      return null;
    }
  }
];

export default function ShopPage() {
  const navigate = useNavigate();
  const store = useStore();
  const { config } = store;

  const notchOptions = [
    { id: 'none', label: 'None', price: 0 },
    { id: 'notchesWavedash', label: 'Wavedash Notches', price: 20 },
    { id: 'notchesFirefox', label: 'Firefox Notches', price: 40 },
  ];
  const selectedNotch = config.notchesFirefox ? 'notchesFirefox' : config.notchesWavedash ? 'notchesWavedash' : 'none';

  const triggerModOptions = [
    { id: 'none', label: 'Standard Triggers', price: 0 },
    { id: 'triggerPlugs', label: 'Trigger Plugs', price: 0 },
    { id: 'kalihChoco', label: 'Kalih Choco Switch', price: (config.kalihChocoSide ?? 'both') === 'both' ? 40 : 30 },
  ];
  const selectedTriggerMod = config.kalihChoco ? 'kalihChoco' : config.triggerPlugs ? 'triggerPlugs' : 'none';

  const springOptions = [
    { id: 'none', label: 'Standard Springs', price: 0 },
    { id: 'springCut', label: 'Cut Springs', price: 0 },
  ];
  const selectedSpring = config.springCut ? 'springCut' : 'none';

  const notchStyles = [
    { id: 'deep', label: 'Deep Grooves (Default)', price: 0 },
    { id: 'subtle', label: 'Subtle Notches', price: 15 },
  ];

  const triggerPlugLengths = [
    { id: 'tall', label: 'Tall', price: 0 },
    { id: 'short', label: 'Short', price: 0 },
  ];
  const isFullBuild = config.product === 'full-build';
  const isDIY = config.product === 'diy-kit' || config.product === '0-solder-diy-kit';

  const selectedShell = shells.find(s => s.id === config.shell);

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
                <VariantSelector
                  title="Shell"
                  items={shells}
                  facets={shellFacets}
                  value={config.shell}
                  onChange={store.setShell}
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

                <VariantSelector 
                  title="Buttons" 
                  items={buttons} 
                  facets={buttonFacets} 
                  value={config.buttons} 
                  onChange={store.setButtons} 
                  basePrice={getItemPrice(config.buttons ?? '')} 
                />

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
            <VariantSelector
              title="Stick Caps"
              items={stickCaps}
              facets={stickCapFacets}
              value={config.stickCap}
              onChange={store.setStickCap}
              basePrice={getItemPrice(config.stickCap ?? '')}
            />

            {isFullBuild && (
              <>
                <ConfigSection
                  title="Notches"
                  items={notchOptions}
                  selectedId={selectedNotch}
                  onSelect={(id) => {
                    store.setConfig(prev => ({
                      ...prev,
                      notchesFirefox: id === 'notchesFirefox',
                      notchesWavedash: id === 'notchesWavedash',
                      notchStyle: id === 'none' ? undefined : prev.notchStyle
                    }));
                  }}
                  basePrice={notchOptions.find(n => n.id === selectedNotch)?.price || 0}
                />

                {(config.notchesFirefox || config.notchesWavedash) && (
                  <ConfigSection
                    title="Notch Style"
                    items={notchStyles}
                    selectedId={config.notchStyle || 'deep'}
                    onSelect={(id) => store.setNotchStyle(id as any)}
                    basePrice={notchStyles.find(n => n.id === (config.notchStyle || 'deep'))?.price || 0}
                    variant="sub"
                  />
                )}

                <ConfigSection
                  title="Trigger Modifications"
                  items={triggerModOptions}
                  selectedId={selectedTriggerMod}
                  onSelect={(id) => {
                    store.setConfig(prev => ({
                      ...prev,
                      kalihChoco: id === 'kalihChoco',
                      triggerPlugs: id === 'triggerPlugs',
                    }));
                  }}
                  basePrice={triggerModOptions.find(t => t.id === selectedTriggerMod)?.price || 0}
                />

                {config.triggerPlugs && (
                  <>
                    <ConfigSection
                      title="Trigger Side"
                      items={triggers}
                      selectedId={config.triggerPlugSide || 'both'}
                      onSelect={(id) => store.setTriggerSide(id as any)}
                      basePrice={0}
                      variant="sub"
                    />
                    <ConfigSection
                      title="Trigger Plug Length"
                      items={triggerPlugLengths}
                      selectedId={config.triggerPlugLength || 'tall'}
                      onSelect={(id) => store.setTriggerLength(id as any)}
                      basePrice={0}
                      variant="sub"
                    />
                  </>
                )}

                {config.kalihChoco && (
                  <ConfigSection
                    title="Kalih Choco Side"
                    items={triggers}
                    selectedId={config.kalihChocoSide || 'both'}
                    onSelect={(id) => store.setKalihChocoSide(id as any)}
                    basePrice={0}
                    variant="sub"
                  />
                )}

                <ConfigSection
                  title="Spring Modifications"
                  items={springOptions}
                  selectedId={selectedSpring}
                  onSelect={(id) => {
                    store.setConfig(prev => ({
                      ...prev,
                      springCut: id === 'springCut'
                    }));
                  }}
                  basePrice={0}
                />
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
