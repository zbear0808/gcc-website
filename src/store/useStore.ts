import { create } from 'zustand';
import type { ConfiguratorState, Cart, Inventory } from '@shared/types';
import { sanitizeConfig, calculatePartsTotal } from '@shared/pricing';
import { allItems } from '@shared/catalog';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface AppStore {
  // State
  config: ConfiguratorState;
  cart: Cart;
  inventory: Inventory;

  // Config actions
  setConfig: (updater: (prev: ConfiguratorState) => ConfiguratorState) => void;
  setProduct: (productId: string) => void;
  setShell: (shellId: string) => void;
  setButtons: (buttonId: string) => void;
  setCable: (cableId: string) => void;
  setRumble: (rumbleId: string) => void;
  setSliderPots: (id: string) => void;
  setZButton: (id: string) => void;
  setMembrane: (id: string) => void;
  toggleMod: (modId: string) => void;
  setTriggerSide: (side: 'l' | 'r' | 'both') => void;

  // Cart actions
  addToCart: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;

  // Inventory actions
  setInventory: (inventory: Inventory) => void;
  loadInventory: () => Promise<void>;

  // Helpers
  getStock: (itemId: string) => number;
  isOutOfStock: (itemId: string) => boolean;
  cartTotal: () => number;
  cartCount: () => number;
}

export const useStore = create<AppStore>((set, get) => ({
  config: {},
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

      return { config: sanitizeConfig(updated) };
    }),

  setTriggerSide: (side) =>
    set((state) => ({
      config: sanitizeConfig({ ...state.config, triggerPlugSide: side }),
    })),

  // ==================
  // Cart Actions
  // ==================

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
      const stock = state.inventory[itemId] ?? 0;
      const newVal = Math.min(stock, Math.max(0, current + delta));
      return { cart: { ...state.cart, [itemId]: newVal } };
    }),

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
      console.warn('Backend not running, using client-side fallback inventory.');
      const fallback: Inventory = {};
      for (const item of allItems) {
        fallback[item.id] = 10;
      }
      set({ inventory: fallback });
    }
  },

  // ==================
  // Helpers
  // ==================

  getStock: (itemId) => get().inventory[itemId] ?? 0,

  isOutOfStock: (itemId) => {
    if (itemId === 'rumble-none') return false;
    return (get().inventory[itemId] ?? 0) <= 0;
  },

  cartTotal: () => calculatePartsTotal(get().cart),

  cartCount: () =>
    Object.values(get().cart).reduce((sum, qty) => sum + qty, 0),
}));
