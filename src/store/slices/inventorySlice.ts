import type { StateCreator } from 'zustand';
import type { Inventory } from '@shared/types';
import { allItems } from '@shared/catalog';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface InventorySlice {
  inventory: Inventory;
  inventoryLoaded: boolean;
  setInventory: (inventory: Inventory) => void;
  loadInventory: () => Promise<void>;
  getStock: (itemId: string) => number;
  isOutOfStock: (itemId: string) => boolean;
}

export const createInventorySlice: StateCreator<InventorySlice, [], [], InventorySlice> = (set, get) => ({
  inventory: {},
  inventoryLoaded: false,

  setInventory: (inventory) => set({ inventory, inventoryLoaded: true }),

  loadInventory: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/inventory`);
      if (!res.ok) throw new Error('Server not running');
      const data = await res.json();
      set({ inventory: data, inventoryLoaded: true });
    } catch {
      console.warn('Failed to fetch inventory from server.');

      const currentInventory = get().inventory;
      if (Object.keys(currentInventory).length > 0) return;

      if (import.meta.env.DEV) {
        console.warn('Local development: using fallback inventory.');
        const fallback: Inventory = {};
        for (const item of allItems) {
          fallback[item.id] = 10;
        }
        set({ inventory: fallback, inventoryLoaded: true });
      }
    }
  },

  getStock: (itemId) => get().inventory[itemId] ?? 0,

  isOutOfStock: (itemId) => {
    return (get().inventory[itemId] ?? 0) <= 0;
  },
});
