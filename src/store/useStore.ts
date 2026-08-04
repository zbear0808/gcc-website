import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConfiguratorState, Cart, Inventory, TriggerSide, TriggerPlugLength } from '@shared/types';
import { sanitizeConfig, calculatePartsTotal } from '@shared/pricing';
import { allItems } from '@shared/catalog';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface AppStore {
  // State
  config: ConfiguratorState;
  customBuilds: ConfiguratorState[];
  cart: Cart;
  inventory: Inventory;

  // Config actions
  setConfig: (updater: (prev: ConfiguratorState) => ConfiguratorState) => void;
  setProduct: (productId: string) => void;
  setShell: (shellId: string) => void;
  setButtons: (buttonId: string) => void;
  setCable: (cableId: string) => void;
  setRumble: (rumbleId?: string) => void;
  setSliderPots: (id: string) => void;
  setZButton: (id: string) => void;
  setMembrane: (id: string) => void;
  setStickCap: (id: string) => void;
  toggleMod: (modId: string) => void;
  setNotchStyle: (style: 'deep' | 'subtle') => void;
  setTriggerSide: (side: TriggerSide) => void;
  setTriggerLength: (length: TriggerPlugLength) => void;
  setKalihChocoSide: (side: TriggerSide) => void;

  // Cart actions
  addCustomBuild: (config: ConfiguratorState) => void;
  removeCustomBuild: (index: number) => void;
  addToCart: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;

  // Inventory actions
  setInventory: (inventory: Inventory) => void;
  loadInventory: () => Promise<void>;

  // Helpers
  getStock: (itemId: string) => number;
  isOutOfStock: (itemId: string) => boolean;
  cartTotal: () => number;
  cartCount: () => number;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      config: sanitizeConfig({ product: 'full-build' }),
      customBuilds: [],
      cart: {},
      inventory: {},

  // ==================
  // Config Actions
  // ==================

  setConfig: (updater) =>
    set((state) => ({ config: sanitizeConfig(updater(state.config)) })),

  setProduct: (productId) =>
    set((state) => ({
      config: sanitizeConfig({ ...state.config, product: productId }),
    })),

  setShell: (shellId) =>
    set((state) => ({
      config: sanitizeConfig({ ...state.config, shell: shellId }),
    })),

  setButtons: (buttonId) =>
    set((state) => ({
      config: sanitizeConfig({ ...state.config, buttons: buttonId }),
    })),

  setCable: (cableId) =>
    set((state) => ({
      config: sanitizeConfig({ ...state.config, cable: cableId }),
    })),

  setRumble: (rumbleId) =>
    set((state) => ({
      config: sanitizeConfig({ ...state.config, rumble: rumbleId }),
    })),

  setSliderPots: (id) =>
    set((state) => ({
      config: sanitizeConfig({ ...state.config, sliderPots: id }),
    })),

  setZButton: (id) =>
    set((state) => ({
      config: sanitizeConfig({ ...state.config, zButton: id }),
    })),

  setMembrane: (id) =>
    set((state) => ({
      config: sanitizeConfig({ ...state.config, membrane: id }),
    })),

  setStickCap: (id) =>
    set((state) => ({
      config: sanitizeConfig({ ...state.config, stickCap: id }),
    })),

  toggleMod: (modId) =>
    set((state) => {
      const current = state.config[modId as keyof ConfiguratorState] as boolean | undefined;
      const newVal = !current;
      let updated = { ...state.config, [modId]: newVal };

      // Firefox and wavedash notches are mutually exclusive
      if (modId === 'notchesFirefox' && newVal) {
        updated = { ...updated, notchesWavedash: false };
      }
      if (modId === 'notchesWavedash' && newVal) {
        updated = { ...updated, notchesFirefox: false };
      }

      if (modId === 'triggerPlugs' && newVal) {
        updated = { ...updated, kalihChoco: false };
      }
      if (modId === 'kalihChoco' && newVal) {
        updated = { ...updated, triggerPlugs: false };
      }

      return { config: sanitizeConfig(updated) };
    }),

  setNotchStyle: (style) =>
    set((state) => ({
      config: sanitizeConfig({ ...state.config, notchStyle: style }),
    })),

  setTriggerSide: (side) =>
    set((state) => ({
      config: sanitizeConfig({ ...state.config, triggerPlugSide: side }),
    })),

  setTriggerLength: (length) =>
    set((state) => ({
      config: sanitizeConfig({ ...state.config, triggerPlugLength: length }),
    })),

  setKalihChocoSide: (side) =>
    set((state) => ({
      config: sanitizeConfig({ ...state.config, kalihChocoSide: side }),
    })),

  // ==================
  // Cart Actions
  // ==================

  addCustomBuild: (config) =>
    set((state) => ({ customBuilds: [...state.customBuilds, config] })),

  removeCustomBuild: (index) =>
    set((state) => ({
      customBuilds: state.customBuilds.filter((_, i) => i !== index),
    })),

  addToCart: (itemId) =>
    set((state) => ({
      cart: { ...state.cart, [itemId]: (state.cart[itemId] ?? 0) + 1 },
    })),

  removeFromCart: (itemId) =>
    set((state) => ({
      cart: {
        ...state.cart,
        [itemId]: Math.max(0, (state.cart[itemId] ?? 0) - 1),
      },
    })),

  updateCartQuantity: (itemId, delta) =>
    set((state) => {
      const current = state.cart[itemId] ?? 0;
      // Default stock to a high number if inventory data is missing to prevent accidentally zeroing out items
      const stock = state.inventory[itemId] ?? 99;
      const newVal = Math.min(stock, Math.max(0, current + delta));
      return { cart: { ...state.cart, [itemId]: newVal } };
    }),

  clearCart: () => set({ cart: {}, customBuilds: [], config: sanitizeConfig({ product: 'full-build' }) }),

  // ==================
  // Inventory Actions
  // ==================

  setInventory: (inventory) => set({ inventory }),

  loadInventory: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/inventory`);
      if (!res.ok) throw new Error('Server not running');
      const data = await res.json();
      set({ inventory: data });
    } catch {
      console.warn('Failed to fetch inventory from server.');
      
      const currentInventory = get().inventory;
      if (Object.keys(currentInventory).length > 0) {
        // Retain existing inventory data
        return;
      }

      if (import.meta.env.DEV) {
        console.warn('Local development: using fallback inventory.');
        const fallback: Inventory = {};
        for (const item of allItems) {
          fallback[item.id] = 10;
        }
        set({ inventory: fallback });
      }
    }
  },

  // ==================
  // Helpers
  // ==================

  getStock: (itemId) => get().inventory[itemId] ?? 0,

  isOutOfStock: (itemId) => {
    return (get().inventory[itemId] ?? 0) <= 0;
  },

  cartTotal: () => calculatePartsTotal(get().cart),

  cartCount: () =>
    Object.values(get().cart).reduce((sum, qty) => sum + qty, 0) + get().customBuilds.length,
    }),
    {
      name: 'gcc-shop-storage',
      partialize: (state) => ({ cart: state.cart, config: state.config, customBuilds: state.customBuilds }),
    }
  )
);
