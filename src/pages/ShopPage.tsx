import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { products, shells, buttons, cables, rumbles, sliderPots, zButtons, membranes, stickCaps, mods, addons } from '@shared/catalog';
import { calculateTotal, getItemPrice } from '@shared/pricing';
import ControllerVisualizer from '@/components/ControllerVisualizer';
import ConfigSection from '@/components/ConfigSection';
import VariantSelector from '@/components/VariantSelector';
import '@/assets/styles/pages/shop.css';

const triggers = [
  { id: 'l', label: 'Left Only', price: 0 },
  { id: 'r', label: 'Right Only', price: 0 },
  { id: 'both', label: 'Both', price: 0 },
];

const switchTypes = [
  { id: 'red', label: 'Red (Linear)', price: 0 },
  { id: 'brown', label: 'Brown (Tactile)', price: 0 },
  { id: 'white', label: 'White (Clicky)', price: 0 },
];

import { shellFacets, buttonFacets, stickCapFacets } from '@shared/facets';

export default function ShopPage() {
  const navigate = useNavigate();
  const config = useStore(state => state.config);
  const addCustomBuild = useStore(state => state.addCustomBuild);
  const setConfig = useStore(state => state.setConfig);
  const setProduct = useStore(state => state.setProduct);
  const setShell = useStore(state => state.setShell);
  const setButtons = useStore(state => state.setButtons);
  const setMembrane = useStore(state => state.setMembrane);
  const setCable = useStore(state => state.setCable);
  const setRumble = useStore(state => state.setRumble);
  const setSliderPots = useStore(state => state.setSliderPots);
  const setZButton = useStore(state => state.setZButton);
  const setStickCap = useStore(state => state.setStickCap);
  const toggleMod = useStore(state => state.toggleMod);
  const setNotchStyle = useStore(state => state.setNotchStyle);
  const setTriggerSide = useStore(state => state.setTriggerSide);
  const setTriggerLength = useStore(state => state.setTriggerLength);
  const setkailhChocoSide = useStore(state => state.setkailhChocoSide);
  const setKailhChocoType = useStore(state => state.setKailhChocoType);
  const setTriggerMetalBracketSide = useStore(state => state.setTriggerMetalBracketSide);

  const notchOptions = mods.filter(m => m.id === 'notchesWavedash' || m.id === 'notchesFirefox');
  const selectedNotch = config.notchesFirefox ? 'notchesFirefox' : config.notchesWavedash ? 'notchesWavedash' : undefined;

  const triggerModOptions = addons
    .filter(a => a.id === 'triggerPlugs' || a.id === 'kailhChoco' || a.id === 'triggerMetalBracket')
    .map(a =>
      a.id === 'kailhChoco'
        ? { ...a, label: 'kailh Choco Switch', price: (config.kailhChocoSide ?? 'both') === 'both' ? 40 : 30 }
        : a.id === 'triggerMetalBracket'
          ? { ...a, price: (config.triggerMetalBracketSide ?? 'both') === 'both' ? 6 : 3 }
          : a
    );
  const selectedTriggerMod = config.kailhChoco ? 'kailhChoco' : config.triggerMetalBracket ? 'triggerMetalBracket' : config.triggerPlugs ? 'triggerPlugs' : undefined;

  const springOptions = addons.filter(a => a.id === 'springCut');
  const selectedSpring = config.springCut ? 'springCut' : undefined;

  const detachableTriggerOptions = mods.filter(m => m.id === 'detachableTriggerPaddle');
  const selectedDetachableTrigger = config.detachableTriggerPaddle ? 'detachableTriggerPaddle' : undefined;

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
    addCustomBuild(config);
    // Reset to default config for a fresh build if they come back
    setConfig(() => ({ product: 'full-build' }));
    navigate('/cart');
  };

  return (
    <div className="shop-page">
      <div className="shop-layout">
        <div className="visualizer-col">
          <ControllerVisualizer />
        </div>
        <div className="config-panel">
          <h2 className="product-section-title">Select Product</h2>
          <div className="product-selector">
            {products.filter(p => p.id !== 'board-only').map(p => (
              <button
                key={p.id}
                className={`product-btn ${config.product === p.id ? 'active' : ''}`}
                onClick={() => setProduct(p.id)}
              >
                <div className="product-btn-label">{p.label}</div>
                <div className="product-btn-price">From ${p.price}</div>
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
                  onChange={setShell}
                  basePrice={getItemPrice(config.shell ?? '')}
                  showExternalLinks={true}
                />

                {['indigo', 'black', 'platinum'].includes(config.shell ?? '') && (
                  <div className="config-section" style={{ marginTop: '-1rem', marginBottom: '2rem' }}>
                    <button
                      className={`mod-btn ${config.wornShell ? 'active' : ''}`}
                      onClick={() => toggleMod('wornShell')}
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
                  onChange={setButtons}
                  basePrice={getItemPrice(config.buttons ?? '')}
                  showExternalLinks={true}
                />

                <ConfigSection
                  title="Rubber Membranes"
                  items={membranes}
                  selectedId={config.membrane}
                  onSelect={setMembrane}
                  basePrice={getItemPrice(config.membrane ?? '')}
                  descriptionPosition="outside"
                  buttonSize="small"
                  showExternalLinks={true}
                />
              </>
            )}

            {[
              { title: 'Cable', items: cables, value: config.cable, onSelect: setCable, descriptionPosition: 'outside', buttonSize: 'small', disabledFn: (item: any) => (item.id === 'cable-oem' && (isDIY || selectedShell?.type !== 'oem')) ? "OEM cables require a full build with an OEM shell" : false },
              { title: 'Rumble Motor', items: rumbles, value: config.rumble, onSelect: (id: string) => setRumble(config.rumble === id ? undefined : id), isToggleable: true, descriptionPosition: 'none', buttonSize: 'small' },
              { title: 'Slider Potentiometers', items: sliderPots, value: config.sliderPots, onSelect: setSliderPots, descriptionPosition: 'outside', buttonSize: 'small' },
              { title: 'Z Button', items: zButtons, value: config.zButton, onSelect: setZButton, descriptionPosition: 'none', buttonSize: 'small' }
            ].map(section => (
              <React.Fragment key={section.title}>
                <ConfigSection
                  title={section.title}
                  items={section.items}
                  selectedId={section.value}
                  onSelect={section.onSelect}
                  disabledFn={section.disabledFn}
                  isToggleable={section.isToggleable}
                  basePrice={getItemPrice(section.value ?? '')}
                  descriptionPosition={section.descriptionPosition as any}
                  buttonSize={section.buttonSize as any}
                  showExternalLinks={true}
                />
                {section.title === 'Cable' && config.cable === 'cable-oem' && (
                  <div className="oem-warning">
                    <strong>Please Note:</strong> While we rigorously test all full controller builds, we cannot test the durability of salvaged OEM parts. There is no warranty on OEM cables, so we recommend purchasing a new backup cable.
                  </div>
                )}
              </React.Fragment>
            ))}
            {isFullBuild && (
              <VariantSelector
                title="Sticks"
                items={stickCaps}
                facets={stickCapFacets}
                value={config.stickCap}
                onChange={setStickCap}
                basePrice={getItemPrice(config.stickCap ?? '')}
                showExternalLinks={true}
              />
            )}

            {isFullBuild && (
              <>
                <ConfigSection
                  title="Notches"
                  items={notchOptions}
                  selectedId={selectedNotch}
                  isToggleable={true}
                  onSelect={(id) => {
                    setConfig(prev => {
                      if (selectedNotch === id) {
                        return {
                          ...prev,
                          notchesFirefox: false,
                          notchesWavedash: false,
                          notchStyle: undefined
                        };
                      }
                      return {
                        ...prev,
                        notchesFirefox: id === 'notchesFirefox',
                        notchesWavedash: id === 'notchesWavedash',
                        notchStyle: prev.notchStyle
                      };
                    });
                  }}
                  basePrice={0}
                  hideStock={true}
                  showExternalLinks={true}
                />

                {(config.notchesFirefox || config.notchesWavedash) && (
                  <ConfigSection
                    title="Notch Style"
                    items={notchStyles}
                    selectedId={config.notchStyle || 'deep'}
                    onSelect={(id) => setNotchStyle(id as 'deep' | 'subtle')}
                    basePrice={notchStyles.find(n => n.id === (config.notchStyle || 'deep'))?.price || 0}
                    variant="sub"
                    hideStock={true}
                    showExternalLinks={true}
                  />
                )}

                <ConfigSection
                  title="Trigger Modifications"
                  items={triggerModOptions}
                  selectedId={selectedTriggerMod}
                  isToggleable={true}
                  onSelect={(id) => {
                    setConfig(prev => {
                      if (selectedTriggerMod === id) {
                        return {
                          ...prev,
                          kailhChoco: false,
                          triggerPlugs: false,
                          triggerMetalBracket: false
                        };
                      }
                      return {
                        ...prev,
                        kailhChoco: id === 'kailhChoco',
                        triggerPlugs: id === 'triggerPlugs',
                        triggerMetalBracket: id === 'triggerMetalBracket',
                        ...(id === 'kailhChoco' ? { detachableTriggerPaddle: false } : {})
                      };
                    });
                  }}
                  basePrice={0}
                  showExternalLinks={true}
                />

                {config.triggerPlugs && (
                  <>
                    <ConfigSection
                      title="Trigger Side"
                      items={triggers}
                      selectedId={config.triggerPlugSide || 'both'}
                      onSelect={(id) => setTriggerSide(id as import('@shared/types').TriggerSide)}
                      basePrice={0}
                      variant="sub"
                      showExternalLinks={true}
                    />
                    <ConfigSection
                      title="Trigger Plug Length"
                      items={triggerPlugLengths}
                      selectedId={config.triggerPlugLength || 'tall'}
                      onSelect={(id) => setTriggerLength(id as import('@shared/types').TriggerPlugLength)}
                      basePrice={0}
                      variant="sub"
                      showExternalLinks={true}
                    />
                  </>
                )}

                {config.triggerMetalBracket && (
                  <ConfigSection
                    title="Trigger Metal Bracket Side"
                    items={triggers}
                    selectedId={config.triggerMetalBracketSide || 'both'}
                    onSelect={(id) => setTriggerMetalBracketSide(id as import('@shared/types').TriggerSide)}
                    basePrice={0}
                    variant="sub"
                    showExternalLinks={true}
                  />
                )}

                {config.kailhChoco && (
                  <>
                    <ConfigSection
                      title="kailh Choco Side"
                      items={triggers}
                      selectedId={config.kailhChocoSide || 'both'}
                      onSelect={(id) => setkailhChocoSide(id as import('@shared/types').TriggerSide)}
                      basePrice={0}
                      variant="sub"
                      showExternalLinks={true}
                    />
                    <ConfigSection
                      title="Switch Type"
                      items={switchTypes}
                      selectedId={config.kailhChocoType || 'red'}
                      onSelect={(id) => setKailhChocoType(id as 'red' | 'brown' | 'white')}
                      basePrice={0}
                      variant="sub"
                      showExternalLinks={false}
                    />
                  </>
                )}

                <ConfigSection
                  title="Spring Modifications"
                  items={springOptions}
                  selectedId={selectedSpring}
                  isToggleable={true}
                  onSelect={(id) => {
                    setConfig(prev => ({
                      ...prev,
                      springCut: selectedSpring === id ? false : id === 'springCut'
                    }));
                  }}
                  basePrice={0}
                  hideStock={true}
                  showExternalLinks={true}
                />

                <ConfigSection
                  title="Detachable Trigger Paddle"
                  items={detachableTriggerOptions}
                  selectedId={selectedDetachableTrigger}
                  isToggleable={true}
                  onSelect={(id) => {
                    setConfig(prev => ({
                      ...prev,
                      detachableTriggerPaddle: selectedDetachableTrigger === id ? false : id === 'detachableTriggerPaddle',
                      ...(selectedDetachableTrigger !== id && id === 'detachableTriggerPaddle' ? { kailhChoco: false } : {})
                    }));
                  }}
                  basePrice={0}
                  hideStock={true}
                  showExternalLinks={true}
                />
              </>
            )}

            {isDIY && (
              <ConfigSection
                title="Trigger Modifications"
                items={[{ id: 'triggerMetalBracket', label: 'Trigger Metal Bracket (Pair)', price: 6, image: '/images/addons/trigger-metal-bracket.png', requiresInventory: false } as any]}
                selectedId={config.triggerMetalBracket ? 'triggerMetalBracket' : undefined}
                isToggleable={true}
                onSelect={(id) => {
                  setConfig(prev => ({
                    ...prev,
                    triggerMetalBracket: config.triggerMetalBracket ? false : true
                  }));
                }}
                basePrice={0}
                showExternalLinks={false}
              />
            )}
          </>

          <div className="price-breakdown">
            <h3>Total: ${calculateTotal(config)}</h3>
          </div>

          <button
            className="checkout-btn checkout-btn-alt"
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

