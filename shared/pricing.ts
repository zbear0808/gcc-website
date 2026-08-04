import type { ConfiguratorState, CatalogItem, StripeLineItem } from './types';
import {
  shells,
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

export function formatPrice(price: number): string {
  return Number.isInteger(price) ? price.toString() : price.toFixed(2);
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
      shell: result.shell ?? 'indigo',
      buttons: result.buttons ?? 'oem-buttons',
      rumble: result.rumble ?? 'rumble-oem',
      cable: result.cable ?? 'cable-paracord-3m',
      sliderPots: result.sliderPots ?? 'slider-pot-alps',
      zButton: result.zButton ?? 'tactile-z',
      membrane: result.membrane ?? 'membrane-extremerate',
      stickCap: result.stickCap ?? 'gc-cap-okay',
      notchStyle: result.notchStyle ?? 'deep',
    };
  } else if (isDiyKit(result)) {
    result = {
      ...result,
      cable: result.cable ?? 'cable-paracord-3m',
      sliderPots: result.sliderPots ?? 'slider-pot-alps',
      zButton: result.zButton ?? 'tactile-z',
      membrane: result.membrane ?? 'membrane-extremerate',
      stickCap: result.stickCap ?? 'gc-cap-okay',
    };
  }

  // OEM cable is only available with OEM shells on full builds (not DIY kits)
  if (result.cable === 'cable-oem') {
    const selectedShell = shells.find((s) => s.id === result.shell);
    if (selectedShell?.type !== 'oem' || isDiyKit(result)) {
      result = { ...result, cable: 'cable-paracord-3m' };
    }
  }

  // Worn shell discount only applies to indigo, black, platinum
  if (result.wornShell && !['indigo', 'black', 'platinum'].includes(result.shell ?? '')) {
    result.wornShell = false;
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

    let kalihChocoPremium = 0;
    if (sanitized.kalihChoco) {
      kalihChocoPremium = (sanitized.kalihChocoSide ?? 'both') === 'both' ? 40 : 30;
    }

    const wornDiscount = sanitized.wornShell ? -4 : 0;
    
    let subtlePremium = 0;
    if (sanitized.notchStyle === 'subtle' && (sanitized.notchesFirefox || sanitized.notchesWavedash)) {
      subtlePremium = 15;
    }

    return (
      base +
      modsTotal +
      addonsTotal +
      kalihChocoPremium +
      wornDiscount +
      subtlePremium +
      getItemPrice(sanitized.shell ?? '') +
      getItemPrice(sanitized.buttons ?? '') +
      getItemPrice(sanitized.rumble ?? '') +
      getItemPrice(sanitized.cable ?? '') +
      getItemPrice(sanitized.sliderPots ?? '') +
      getItemPrice(sanitized.zButton ?? '') +
      getItemPrice(sanitized.membrane ?? '') +
      getItemPrice(sanitized.stickCap ?? '')
    );
  }

  if (isDiyKit(sanitized)) {
    return (
      base +
      getItemPrice(sanitized.cable ?? '') +
      getItemPrice(sanitized.sliderPots ?? '') +
      getItemPrice(sanitized.zButton ?? '') +
      getItemPrice(sanitized.membrane ?? '') +
      getItemPrice(sanitized.stickCap ?? '')
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

  let basePrice = selectedProduct.individualPrice ?? selectedProduct.price ?? 0;
  if (isFullBuild(sanitized) && sanitized.wornShell) {
    basePrice -= 4; // Apply worn shell discount directly to base build item
  }

  const baseItem = createStripeLineItem({ ...selectedProduct, individualPrice: basePrice }, baseName);
  const items: StripeLineItem[] = baseItem ? [baseItem] : [];

  if (isFullBuild(sanitized)) {
    // Active mods
    for (const mod of mods) {
      if (sanitized[mod.id as keyof ConfiguratorState]) {
        const item = createStripeLineItem(mod as unknown as CatalogItem);
        if (item) items.push(item);
      }
    }

    if (sanitized.notchStyle === 'subtle' && (sanitized.notchesFirefox || sanitized.notchesWavedash)) {
      const subtleItem = createStripeLineItem({
        id: 'subtle-notches-premium',
        label: 'Subtle Notches Premium',
        price: 15
      });
      if (subtleItem) items.push(subtleItem);
    }

    // Active addons
    for (const addon of addons) {
      if (sanitized[addon.id as keyof ConfiguratorState]) {
        const label =
          addon.id === 'triggerPlugs'
            ? `${(sanitized.triggerPlugLength ?? 'tall').charAt(0).toUpperCase() + (sanitized.triggerPlugLength ?? 'tall').slice(1)} Trigger Plugs (${(sanitized.triggerPlugSide ?? 'both').toUpperCase()})`
            : addon.id === 'kalihChoco'
            ? `Kalih Choco Switch Mechanical Trigger (${(sanitized.kalihChocoSide ?? 'both').toUpperCase()})`
            : undefined;
        
        const priceOverride = addon.id === 'kalihChoco'
          ? ((sanitized.kalihChocoSide ?? 'both') === 'both' ? 40 : 30)
          : addon.price;

        const item = createStripeLineItem({ ...addon, price: priceOverride } as unknown as CatalogItem, label);
        if (item) items.push(item);
      }
    }

    // Component selections
    for (const id of [sanitized.buttons, sanitized.rumble, sanitized.cable, sanitized.sliderPots, sanitized.zButton, sanitized.membrane, sanitized.stickCap]) {
      if (id) {
        const catalogItem = getItem(id);
        if (catalogItem) {
          const item = createStripeLineItem(catalogItem);
          if (item) items.push(item);
        }
      }
    }
  } else if (isDiyKit(sanitized)) {
    for (const id of [sanitized.cable, sanitized.sliderPots, sanitized.zButton, sanitized.membrane, sanitized.stickCap]) {
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
    if (config.shell) {
      if (config.wornShell) {
        items.push(`${config.shell}-worn`);
      } else {
        items.push(config.shell);
      }
    }
    if (config.buttons) items.push(config.buttons);
    if (config.cable) items.push(config.cable);
    if (config.rumble) items.push(config.rumble);
    if (config.sliderPots) items.push(config.sliderPots);
    if (config.zButton) items.push(config.zButton);
    if (config.stickCap) items.push(config.stickCap);
    if (config.triggerPlugs) items.push(`trigger-plugs-${config.triggerPlugLength ?? 'tall'}`);
    if (config.kalihChoco) items.push(`kalih-choco-${config.kalihChocoSide ?? 'both'}`);
  } else if (isDiyKit(config)) {
    if (config.cable) items.push(config.cable);
    if (config.sliderPots) items.push(config.sliderPots);
    if (config.zButton) items.push(config.zButton);
    if (config.stickCap) items.push(config.stickCap);
  }

  return items;
}

export function extractRequestedItems(payload: {
  config?: ConfiguratorState;
  customBuilds?: ConfiguratorState[];
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

  if (payload.customBuilds) {
    for (const build of payload.customBuilds) {
      const configItems = getAllItemsFromConfig(build);
      for (const item of configItems) {
        itemsMap[item] = (itemsMap[item] ?? 0) + 1;
      }
    }
  }

  return itemsMap;
}
