import type { ConfiguratorState, CatalogItem, StripeLineItem } from './types';
import {
  products,
  shells,
  buttons,
  cables,
  rumbles,
  sliderPots,
  zButtons,
  membranes,
  mods,
  addons,
  allItems,
  individualItems,
} from './catalog';

// ==================
// Item Lookup
// ==================

const itemLookup = new Map<string, CatalogItem>(
  allItems.map((item) => [item.id, item])
);

export function getItem(id: string): CatalogItem | undefined {
  return itemLookup.get(id);
}

export function getItemPrice(id: string): number {
  return getItem(id)?.price ?? 0;
}

export function productById(productId: string): CatalogItem | undefined {
  return getItem(productId);
}

// ==================
// Product Type Predicates
// ==================

export function isFullBuild(config: ConfiguratorState): boolean {
  return config.product === 'full-build';
}

export function isDiyKit(config: ConfiguratorState): boolean {
  return config.product === 'diy-kit' || config.product === '0-solder-diy-kit';
}

export function isCustomizable(config: ConfiguratorState): boolean {
  return isFullBuild(config) || isDiyKit(config);
}

// ==================
// Config Sanitization
// ==================

export function sanitizeConfig(config: ConfiguratorState): ConfiguratorState {
  let result = { ...config };

  if (isFullBuild(result)) {
    result = {
      ...result,
      shell: result.shell ?? 'white',
      buttons: result.buttons ?? 'oem-buttons',
      rumble: result.rumble ?? 'rumble-none',
      cable: result.cable ?? 'cable-3rd-party-3m',
      sliderPots: result.sliderPots ?? 'slider-pot-alps',
      zButton: result.zButton ?? 'tactile-z',
      membrane: result.membrane ?? 'membrane-extremerate',
    };
  } else if (isDiyKit(result)) {
    result = {
      ...result,
      cable: result.cable ?? 'cable-3rd-party-3m',
      sliderPots: result.sliderPots ?? 'slider-pot-alps',
      zButton: result.zButton ?? 'tactile-z',
      membrane: result.membrane ?? 'membrane-extremerate',
    };
  }

  // OEM cable is only available with OEM shells on full builds (not DIY kits)
  if (result.cable === 'cable-oem') {
    const selectedShell = shells.find((s) => s.id === result.shell);
    if (selectedShell?.type !== 'oem' || isDiyKit(result)) {
      result = { ...result, cable: 'cable-3rd-party-3m' };
    }
  }

  return result;
}

// ==================
// Price Calculation
// ==================

export function calculateTotal(config: ConfiguratorState): number {
  const sanitized = sanitizeConfig(config);
  const base = getItemPrice(sanitized.product ?? '');

  if (isFullBuild(sanitized)) {
    const modsTotal = mods
      .filter((m) => sanitized[m.id as keyof ConfiguratorState])
      .reduce((sum, m) => sum + m.price, 0);

    const addonsTotal = addons
      .filter((a) => sanitized[a.id as keyof ConfiguratorState])
      .reduce((sum, a) => sum + (a.price ?? 0), 0);

    return (
      base +
      modsTotal +
      addonsTotal +
      getItemPrice(sanitized.shell ?? '') +
      getItemPrice(sanitized.buttons ?? '') +
      getItemPrice(sanitized.rumble ?? '') +
      getItemPrice(sanitized.cable ?? '') +
      getItemPrice(sanitized.sliderPots ?? '') +
      getItemPrice(sanitized.zButton ?? '') +
      getItemPrice(sanitized.membrane ?? '')
    );
  }

  if (isDiyKit(sanitized)) {
    return (
      base +
      getItemPrice(sanitized.cable ?? '') +
      getItemPrice(sanitized.sliderPots ?? '') +
      getItemPrice(sanitized.zButton ?? '') +
      getItemPrice(sanitized.membrane ?? '')
    );
  }

  return base;
}

// ==================
// Stripe Line Items
// ==================

export function createStripeLineItem(
  item: CatalogItem,
  labelOverride?: string
): StripeLineItem | null {
  const price = item.individualPrice ?? item.price ?? 0;
  if (price <= 0) return null;

  return {
    price_data: {
      currency: 'usd',
      product_data: { name: labelOverride ?? item.label },
      unit_amount: Math.round(price * 100),
    },
    quantity: 1,
  };
}

export function getLineItems(config: ConfiguratorState): StripeLineItem[] {
  const sanitized = sanitizeConfig(config);
  const selectedProduct = getItem(sanitized.product ?? '');
  if (!selectedProduct) return [];

  const baseName = isFullBuild(sanitized)
    ? `${selectedProduct.label} - ${getItem(sanitized.shell ?? '')?.label ?? ''} Shell`
    : selectedProduct.label;

  const baseItem = createStripeLineItem(selectedProduct, baseName);
  const items: StripeLineItem[] = baseItem ? [baseItem] : [];

  if (isFullBuild(sanitized)) {
    // Active mods
    for (const mod of mods) {
      if (sanitized[mod.id as keyof ConfiguratorState]) {
        const item = createStripeLineItem(mod as unknown as CatalogItem);
        if (item) items.push(item);
      }
    }

    // Active addons
    for (const addon of addons) {
      if (sanitized[addon.id as keyof ConfiguratorState]) {
        const label =
          addon.id === 'triggerPlugs'
            ? `Trigger Plugs (${(sanitized.triggerPlugSide ?? 'both').toUpperCase()})`
            : undefined;
        const item = createStripeLineItem(addon as unknown as CatalogItem, label);
        if (item) items.push(item);
      }
    }

    // Component selections
    for (const id of [sanitized.buttons, sanitized.rumble, sanitized.cable, sanitized.sliderPots, sanitized.zButton, sanitized.membrane]) {
      if (id) {
        const catalogItem = getItem(id);
        if (catalogItem) {
          const item = createStripeLineItem(catalogItem);
          if (item) items.push(item);
        }
      }
    }
  } else if (isDiyKit(sanitized)) {
    for (const id of [sanitized.cable, sanitized.sliderPots, sanitized.zButton, sanitized.membrane]) {
      if (id) {
        const catalogItem = getItem(id);
        if (catalogItem) {
          const item = createStripeLineItem(catalogItem);
          if (item) items.push(item);
        }
      }
    }
  }

  return items;
}

// ==================
// Individual Items Lookup
// ==================

const individualItemLookup = new Map<string, CatalogItem>(
  individualItems.map((item) => [item.id, item])
);

export function calculatePartsTotal(cart: Record<string, number>): number {
  let total = 0;
  for (const [partId, quantity] of Object.entries(cart)) {
    const part = individualItemLookup.get(partId);
    if (part?.individualPrice) {
      total += part.individualPrice * quantity;
    }
  }
  return total;
}

export function getPartsLineItems(cart: Record<string, number>): StripeLineItem[] {
  const items: StripeLineItem[] = [];
  for (const [partId, quantity] of Object.entries(cart)) {
    if (quantity <= 0) continue;
    const part = individualItemLookup.get(partId);
    if (!part) continue;
    const lineItem = createStripeLineItem(part);
    if (lineItem) {
      items.push({ ...lineItem, quantity });
    }
  }
  return items;
}

// ==================
// Inventory Helpers (used by API)
// ==================

export function getAllItemsFromConfig(config: ConfiguratorState): string[] {
  const items: string[] = [];
  if (config.product) items.push(config.product);

  if (isFullBuild(config)) {
    if (config.shell) items.push(config.shell);
    if (config.buttons) items.push(config.buttons);
    if (config.cable) items.push(config.cable);
    if (config.rumble) items.push(config.rumble);
    if (config.sliderPots) items.push(config.sliderPots);
    if (config.zButton) items.push(config.zButton);
    if (config.notchesFirefox) items.push('notchesFirefox');
    if (config.notchesWavedash) items.push('notchesWavedash');
    if (config.triggerPlugs) items.push('triggerPlugs');
    if (config.springCut) items.push('springCut');
  } else if (isDiyKit(config)) {
    if (config.cable) items.push(config.cable);
    if (config.sliderPots) items.push(config.sliderPots);
    if (config.zButton) items.push(config.zButton);
  }

  return items;
}

export function extractRequestedItems(payload: {
  config?: ConfiguratorState;
  cart?: Record<string, number>;
  parts?: boolean;
}): Record<string, number> {
  const itemsMap: Record<string, number> = payload.parts ? { ...(payload.cart ?? {}) } : {};

  if (payload.config?.product) {
    const configItems = getAllItemsFromConfig(payload.config);
    for (const item of configItems) {
      itemsMap[item] = (itemsMap[item] ?? 0) + 1;
    }
  }

  return itemsMap;
}
