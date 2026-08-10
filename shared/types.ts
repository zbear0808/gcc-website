// ==================
// Item Category Types
// ==================

export type ShellType = 'oem' | 'extremerate';
export type ButtonType = 'oem' | 'extremerate' | 'other-3rd-party';
export type TriggerSide = 'l' | 'r' | 'both';
export type TriggerPlugLength = 'tall' | 'short';

// ==================
// Base Item Interface
// ==================

export interface CatalogItem {
  id: string;
  label: string;
  description?: string;
  price: number;
  individualPrice?: number;
  image?: string;
  weight?: number; // Weight in ounces
  requiresInventory?: boolean;
}

// ==================
// Shipping Types
// ==================

export interface ParcelDimensions {
  weight: number; // Total weight in ounces
  length: number;
  width: number;
  height: number;
}

// ==================
// Specific Item Types
// ==================

export interface Product extends CatalogItem {
  // Products always have description and image
  description: string;
  image: string;
}

export interface ShellOption extends CatalogItem {
  type: ShellType;
}

export interface ButtonOption extends CatalogItem {
  type: ButtonType;
}

export interface CableOption extends CatalogItem {}

export interface RumbleOption extends CatalogItem {}

export interface SliderPotOption extends CatalogItem {}

export interface ZButtonOption extends CatalogItem {}

export interface MembraneOption extends CatalogItem {}

export interface StickCapOption extends CatalogItem {}

export interface TriggerPaddlePcbOption extends CatalogItem {}

export interface ModOption {
  id: string;
  label: string;
  description?: string;
  price: number;
  image: string;
  requiresInventory?: boolean;
}

export interface AddonOption {
  id: string;
  label: string;
  price: number;
  image: string;
  requiresInventory?: boolean;
}

export interface PartItem extends CatalogItem {}

// ==================
// Catalog Category
// ==================

export interface CatalogCategory {
  id: string;
  label: string;
  description: string;
  image: string;
  subtypes: CatalogItem[];
}

// ==================
// Configurator State
// ==================

export interface ConfiguratorState {
  product?: string;
  shell?: string;
  buttons?: string;
  cable?: string;
  rumble?: string;
  sliderPots?: string;
  zButton?: string;
  membrane?: string;
  stickCap?: string;
  notchesFirefox?: boolean;
  notchesWavedash?: boolean;
  detachableTriggerPaddle?: boolean;
  notchStyle?: 'deep' | 'subtle';
  triggerPlugs?: boolean;
  kalihChoco?: boolean;
  kalihChocoSide?: TriggerSide;
  springCut?: boolean;
  wornShell?: boolean;
  triggerPlugSide?: TriggerSide;
  triggerPlugLength?: TriggerPlugLength;
}

// ==================
// Cart & Inventory
// ==================

export type Cart = Record<string, number>;
export type Inventory = Record<string, number>;

// ==================
// Stripe Line Item
// ==================

export interface StripeLineItem {
  price_data: {
    currency: string;
    product_data: { name: string };
    unit_amount: number;
  };
  quantity: number;
}

// ==================
// API Request/Response
// ==================

export interface CheckoutPayload {
  config?: ConfiguratorState;
  customBuilds?: ConfiguratorState[];
  cart?: Cart;
  parts?: boolean;
}

export interface RedisOrder extends CheckoutPayload {
  status: 'cart' | 'paid' | 'shipped';
  email?: string;
  shipmentId?: string;
  rateId?: string;
  trackingUrl?: string;
  trackingNumber?: string;
  paidAt?: string;
  stripePaymentIntentId?: string;
}

export interface CheckoutResponse {
  url: string;
}

export interface InventoryResponse {
  [itemId: string]: number;
}

// ==================
// Config Section Props
// ==================

export interface ConfigSectionGroup {
  groupTitle: string;
  filterFn: (item: CatalogItem) => boolean;
}
