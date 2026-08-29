import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import {
  products, shells, buttons, cables, rumbles, sliderPots, zButtons, membranes, stickCaps,
  getNotchOptions, getTriggerModOptions, getSpringOptions, getDetachableTriggerOptions
} from '@shared/catalog';
import { calculateTotal, getItemPrice } from '@shared/pricing';
import ControllerVisualizer from '@/components/ControllerVisualizer';
import ConfigSection from '@/components/ConfigSection';
import VariantSelector from '@/components/VariantSelector';
import { shellFacets, buttonFacets, stickCapFacets } from '@shared/facets';

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

const notchStyles = [
  { id: 'deep', label: 'Deep Grooves (Default)', price: 0 },
  { id: 'subtle', label: 'Subtle Notches', price: 15 },
];

const triggerPlugLengths = [
  { id: 'tall', label: 'Tall', price: 0 },
  { id: 'short', label: 'Short', price: 0 },
];

export default function ShopPage() {
  const navigate = useNavigate();
  const config = useStore(state => state.config);
  const addCustomBuild = useStore(state => state.addCustomBuild);
  const updateConfig = useStore(state => state.updateConfig);

  const toggleMod = useStore(state => state.toggleMod);

  const notchOptions = getNotchOptions(config);
  const selectedNotch = config.notchesFirefox ? 'notchesFirefox' : config.notchesWavedash ? 'notchesWavedash' : undefined;

  const triggerModOptions = getTriggerModOptions(config);
  const selectedTriggerMod = config.kailhChoco ? 'kailhChoco' : config.triggerMetalBracket ? 'triggerMetalBracket' : config.triggerPlugs ? 'triggerPlugs' : undefined;

  const springOptions = getSpringOptions();
  const selectedSpring = config.springCut ? 'springCut' : undefined;

  const detachableTriggerOptions = getDetachableTriggerOptions();
  const selectedDetachableTrigger = config.detachableTriggerPaddle ? 'detachableTriggerPaddle' : undefined;

  const isFullBuild = config.product === 'full-build';
  const isDIY = config.product === 'diy-kit' || config.product === '0-solder-diy-kit';

  const selectedShell = shells.find(s => s.id === config.shell);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAddToCart = () => {
    addCustomBuild(config);
    // Reset to default config for a fresh build if they come back
    updateConfig({ product: 'full-build' });
    navigate('/cart');
  };

  return (
    <div className="shop-page">
      <div className="shop-layout">
        <div className={`visualizer-col ${isScrolled ? 'is-scrolled' : ''}`}>
          <ControllerVisualizer isMinimized={isScrolled} />
        </div>
        <div className="config-panel glass-panel">
          <h2 className="product-section-title">Select Product</h2>
          <div className="product-selector">
            {products.filter(p => p.id !== 'board-only').map(p => (
              <button
                key={p.id}
                className={`product-btn ${config.product === p.id ? 'active' : ''}`}
                onClick={() => updateConfig({ product: p.id })}
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
                  onChange={(val) => updateConfig({ shell: val })}
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
                  onChange={(val) => updateConfig({ buttons: val })}
                  basePrice={getItemPrice(config.buttons ?? '')}
                  showExternalLinks={true}
                />

                <ConfigSection
                  title="Rubber Membranes"
                  items={membranes}
                  selectedId={config.membrane}
                  onSelect={(val) => updateConfig({ membrane: val })}
                  basePrice={getItemPrice(config.membrane ?? '')}
                  descriptionPosition="outside"
                  buttonSize="small"
                  showExternalLinks={true}
                />
              </>
            )}

            {[
              { title: 'Cable', items: cables, value: config.cable, onSelect: (val: string) => updateConfig({ cable: val }), descriptionPosition: 'outside', buttonSize: 'small', disabledFn: (item: any) => (item.id === 'cable-oem' && (isDIY || selectedShell?.type !== 'oem')) ? "OEM cables require a full build with an OEM shell" : false },
              { title: 'Rumble Motor', items: rumbles, value: config.rumble, onSelect: (id: string) => updateConfig({ rumble: config.rumble === id ? undefined : id }), isToggleable: true, descriptionPosition: 'none', buttonSize: 'small' },
              { title: 'Slider Potentiometers', items: sliderPots, value: config.sliderPots, onSelect: (val: string) => updateConfig({ sliderPots: val }), descriptionPosition: 'outside', buttonSize: 'small' },
              { title: 'Z Button', items: zButtons, value: config.zButton, onSelect: (val: string) => updateConfig({ zButton: val }), descriptionPosition: 'none', buttonSize: 'small' }
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
                onChange={(val) => updateConfig({ stickCap: val })}
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
                    updateConfig(() => {
                      if (selectedNotch === id) {
                        return {
                          notchesFirefox: false,
                          notchesWavedash: false,
                          notchStyle: undefined
                        };
                      }
                      return {
                        notchesFirefox: id === 'notchesFirefox',
                        notchesWavedash: id === 'notchesWavedash',
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
                    onSelect={(id) => updateConfig({ notchStyle: id as 'deep' | 'subtle' })}
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
                    updateConfig(() => {
                      if (selectedTriggerMod === id) {
                        return {
                          kailhChoco: false,
                          triggerPlugs: false,
                          triggerMetalBracket: false
                        };
                      }
                      return {
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
                      onSelect={(id) => updateConfig({ triggerPlugSide: id as import('@shared/types').TriggerSide })}
                      basePrice={0}
                      variant="sub"
                      showExternalLinks={true}
                    />
                    <ConfigSection
                      title="Trigger Plug Length"
                      items={triggerPlugLengths}
                      selectedId={config.triggerPlugLength || 'tall'}
                      onSelect={(id) => updateConfig({ triggerPlugLength: id as import('@shared/types').TriggerPlugLength })}
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
                    onSelect={(id) => updateConfig({ triggerMetalBracketSide: id as import('@shared/types').TriggerSide })}
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
                      onSelect={(id) => updateConfig({ kailhChocoSide: id as import('@shared/types').TriggerSide })}
                      basePrice={0}
                      variant="sub"
                      showExternalLinks={true}
                    />
                    <ConfigSection
                      title="Switch Type"
                      items={switchTypes}
                      selectedId={config.kailhChocoType || 'red'}
                      onSelect={(id) => updateConfig({ kailhChocoType: id as 'red' | 'brown' | 'white' })}
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
                    updateConfig(() => ({
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
                    updateConfig(() => ({
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
                onSelect={() => {
                  updateConfig((prev: any) => ({
                    triggerMetalBracket: !prev.triggerMetalBracket
                  }));
                }}
                basePrice={0}
                showExternalLinks={false}
              />
            )}
          </>

          <div className="price-breakdown glass-panel">
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
