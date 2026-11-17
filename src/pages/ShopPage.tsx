import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import {
  products, shells, buttons, cables, rumbles, sliderPots, zButtons, membranes, stickCaps,
  getNotchOptions, getTriggerModOptions, getSpringOptions, getDetachableTriggerOptions
} from '@shared/catalog';
import { calculateTotal, getItemPrice, formatPrice } from '@shared/pricing';
import type { CatalogItem, TriggerSide, TriggerPlugLength } from '@shared/types';
import ControllerVisualizer from '@/components/ControllerVisualizer';
import ConfigSection from '@/components/ConfigSection';
import VariantSelector from '@/components/VariantSelector';
import { shellFacets, buttonFacets, stickCapFacets } from '@shared/facets';

const triggers = [
  { id: 'l', label: 'Left only', price: 0, requiresInventory: false },
  { id: 'r', label: 'Right only', price: 0, requiresInventory: false },
  { id: 'both', label: 'Both', price: 0, requiresInventory: false },
];

const switchTypes = [
  { id: 'red', label: 'Red (linear)', price: 0, requiresInventory: false },
  { id: 'brown', label: 'Brown (tactile)', price: 0, requiresInventory: false },
  { id: 'white', label: 'White (clicky)', price: 0, requiresInventory: false },
];

const notchStyles = [
  { id: 'deep', label: 'Deep grooves (default)', price: 0, requiresInventory: false },
  { id: 'subtle', label: 'Subtle notches', price: 15, requiresInventory: false },
];

const triggerPlugLengths = [
  { id: 'tall', label: 'Tall', price: 0, requiresInventory: false },
  { id: 'short', label: 'Short', price: 0, requiresInventory: false },
];

const diyTriggerMods: CatalogItem[] = [
  { id: 'triggerMetalBracket', label: 'Trigger Metal Bracket (pair)', price: 6, requiresInventory: false },
];

const WORN_SHELL_COLORS = ['indigo', 'black', 'platinum'];

function Step({ number, title, subtitle, children }: { number: number; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="config-step">
      <header className="step-header">
        <span className="step-number">{String(number).padStart(2, '0')}</span>
        <h2 className="step-title">{title}</h2>
        {subtitle && <span className="step-subtitle">{subtitle}</span>}
      </header>
      {children}
    </section>
  );
}

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
  const selectedProduct = products.find(p => p.id === config.product);
  const total = calculateTotal(config);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAddToCart = () => {
    addCustomBuild(config);
    updateConfig({ product: 'full-build' });
    navigate('/cart');
  };

  const cableDisabled = (item: CatalogItem) =>
    item.id === 'cable-oem' && (isDIY || selectedShell?.type !== 'oem')
      ? 'OEM cables need a full build with an OEM shell'
      : false;

  let step = 1;

  return (
    <div className="shop-page">
      <section className="shop-hero">
        <p className="eyebrow">PhobGCC controllers · Seattle</p>
        <h1 className="page-title">Custom GameCube controllers, built by hand</h1>
        <p className="page-intro">
          Pick a shell, buttons and mods and I’ll build it. Every full build gets a PhobGCC board and T3 stickboxes,
          and I play on it for at least 30 minutes before it ships.
        </p>
        <ul className="hero-facts">
          <li><strong>30+ min</strong> hand testing on every build</li>
          <li><strong>6 months</strong> of free repair labor</li>
          <li><strong>USPS</strong> shipping, or pick up at Seattle locals</li>
        </ul>
      </section>

      <div className="shop-layout">
        <aside className={`visualizer-col ${isScrolled ? 'is-scrolled' : ''}`}>
          <ControllerVisualizer isMinimized={isScrolled} />
          <div className="build-summary">
            <div className="build-summary-row">
              <span className="build-summary-label">{selectedProduct?.label ?? 'Your build'}</span>
              <span className="build-summary-total">${formatPrice(total)}</span>
            </div>
            <button className="btn btn-go btn-lg btn-block" onClick={handleAddToCart}>
              Add to cart
            </button>
            <p className="build-summary-note">You can review everything in the cart before checkout.</p>
          </div>
        </aside>

        <div className="config-panel">
          <Step number={step++} title="Start with">
            <div className="product-selector">
              {products.filter(p => p.id !== 'board-only').sort((a, b) => Number(b.id === 'full-build') - Number(a.id === 'full-build')).map(p => (
                <button
                  key={p.id}
                  className={`product-btn ${config.product === p.id ? 'active' : ''}`}
                  onClick={() => updateConfig({ product: p.id })}
                  aria-pressed={config.product === p.id}
                >
                  <span className="product-btn-label">{p.label}</span>
                  <span className="product-btn-price">from ${p.price}</span>
                  <span className="product-btn-desc">{p.description}</span>
                </button>
              ))}
            </div>
          </Step>

          {isFullBuild && (
            <Step number={step++} title="Look" subtitle="Shell, buttons and sticks">
              <VariantSelector
                title="Shell"
                items={shells}
                facets={shellFacets}
                value={config.shell}
                onChange={(val) => updateConfig({ shell: val })}
                basePrice={getItemPrice(config.shell ?? '')}
                showExternalLinks={true}
              />

              {WORN_SHELL_COLORS.includes(config.shell ?? '') && (
                <label className="inline-toggle">
                  <input type="checkbox" checked={!!config.wornShell} onChange={() => toggleMod('wornShell')} />
                  <span>
                    <strong>Heavily worn shell, save $4.</strong> Real scratches and scuffs, but no cracks.
                  </span>
                </label>
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

              <VariantSelector
                title="Sticks"
                items={stickCaps}
                facets={stickCapFacets}
                value={config.stickCap}
                onChange={(val) => updateConfig({ stickCap: val })}
                basePrice={getItemPrice(config.stickCap ?? '')}
                showExternalLinks={true}
              />
            </Step>
          )}

          <Step number={step++} title={isFullBuild ? 'Feel & internals' : 'Internals'}>
            {isFullBuild && (
              <ConfigSection
                title="Button membranes"
                items={membranes}
                selectedId={config.membrane}
                onSelect={(val) => updateConfig({ membrane: val })}
                basePrice={getItemPrice(config.membrane ?? '')}
                descriptionPosition="outside"
                buttonSize="small"
                showExternalLinks={true}
              />
            )}

            <ConfigSection
              title="Cable"
              items={cables}
              selectedId={config.cable}
              onSelect={(val) => updateConfig({ cable: val })}
              disabledFn={cableDisabled}
              basePrice={getItemPrice(config.cable ?? '')}
              descriptionPosition="outside"
              buttonSize="small"
              showExternalLinks={true}
            >
              {config.cable === 'cable-oem' && (
                <div className="oem-warning">
                  <strong>Heads up:</strong> I test every full build, but I can’t test how long a salvaged OEM cable
                  will last. There’s no warranty on OEM cables, so I’d grab a new backup cable too.
                </div>
              )}
            </ConfigSection>

            <ConfigSection
              title="Rumble motor"
              hint="Optional"
              items={rumbles}
              selectedId={config.rumble}
              onSelect={(id) => updateConfig({ rumble: config.rumble === id ? undefined : id })}
              isToggleable={true}
              basePrice={getItemPrice(config.rumble ?? '')}
              descriptionPosition="none"
              buttonSize="small"
              showExternalLinks={true}
            />

            <ConfigSection
              title="Trigger slider pots"
              items={sliderPots}
              selectedId={config.sliderPots}
              onSelect={(val) => updateConfig({ sliderPots: val })}
              basePrice={getItemPrice(config.sliderPots ?? '')}
              descriptionPosition="outside"
              buttonSize="small"
              showExternalLinks={true}
            />

            <ConfigSection
              title="Z button"
              items={zButtons}
              selectedId={config.zButton}
              onSelect={(val) => updateConfig({ zButton: val })}
              basePrice={getItemPrice(config.zButton ?? '')}
              descriptionPosition="none"
              buttonSize="small"
              showExternalLinks={true}
            />
          </Step>

          {isFullBuild && (
            <Step number={step++} title="Mods" subtitle="All optional">
              <ConfigSection
                title="Notches"
                items={notchOptions}
                selectedId={selectedNotch}
                isToggleable={true}
                onSelect={(id) => {
                  updateConfig(() => {
                    if (selectedNotch === id) {
                      return { notchesFirefox: false, notchesWavedash: false, notchStyle: undefined };
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
                  title="Notch style"
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
                title="Triggers"
                items={triggerModOptions}
                selectedId={selectedTriggerMod}
                isToggleable={true}
                onSelect={(id) => {
                  updateConfig(() => {
                    if (selectedTriggerMod === id) {
                      return { kailhChoco: false, triggerPlugs: false, triggerMetalBracket: false };
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
                    title="Trigger plug side"
                    items={triggers}
                    selectedId={config.triggerPlugSide || 'both'}
                    onSelect={(id) => updateConfig({ triggerPlugSide: id as TriggerSide })}
                    basePrice={0}
                    variant="sub"
                    showExternalLinks={true}
                  />
                  <ConfigSection
                    title="Trigger plug length"
                    items={triggerPlugLengths}
                    selectedId={config.triggerPlugLength || 'tall'}
                    onSelect={(id) => updateConfig({ triggerPlugLength: id as TriggerPlugLength })}
                    basePrice={0}
                    variant="sub"
                    showExternalLinks={true}
                  />
                </>
              )}

              {config.triggerMetalBracket && (
                <ConfigSection
                  title="Metal bracket side"
                  items={triggers}
                  selectedId={config.triggerMetalBracketSide || 'both'}
                  onSelect={(id) => updateConfig({ triggerMetalBracketSide: id as TriggerSide })}
                  basePrice={0}
                  variant="sub"
                  showExternalLinks={true}
                />
              )}

              {config.kailhChoco && (
                <>
                  <ConfigSection
                    title="Kailh Choco side"
                    items={triggers}
                    selectedId={config.kailhChocoSide || 'both'}
                    onSelect={(id) => updateConfig({ kailhChocoSide: id as TriggerSide })}
                    basePrice={0}
                    variant="sub"
                    showExternalLinks={true}
                  />
                  <ConfigSection
                    title="Switch type"
                    items={switchTypes}
                    selectedId={config.kailhChocoType || 'red'}
                    onSelect={(id) => updateConfig({ kailhChocoType: id as 'red' | 'brown' | 'white' })}
                    basePrice={0}
                    variant="sub"
                  />
                </>
              )}

              <ConfigSection
                title="Springs"
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
                title="Trigger paddle"
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
            </Step>
          )}

          {isDIY && (
            <Step number={step++} title="Add-ons" subtitle="Optional">
              <ConfigSection
                title="Triggers"
                items={diyTriggerMods}
                selectedId={config.triggerMetalBracket ? 'triggerMetalBracket' : undefined}
                isToggleable={true}
                onSelect={() => updateConfig((prev) => ({ triggerMetalBracket: !prev.triggerMetalBracket }))}
                basePrice={0}
              />
            </Step>
          )}
        </div>
      </div>

      <div className="mobile-buy-bar">
        <div>
          <span className="mobile-buy-label">{selectedProduct?.label ?? 'Total'}</span>
          <span className="mobile-buy-total">${formatPrice(total)}</span>
        </div>
        <button className="btn btn-go" onClick={handleAddToCart}>
          Add to cart
        </button>
      </div>
    </div>
  );
}
