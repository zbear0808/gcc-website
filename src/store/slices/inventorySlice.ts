import type { StateCreator } from 'zustand';
import type { Inventory } from '@shared/types';
import { allItems } from '@shared/catalog';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface InventorySlice {
  inventory: Inventory;
  setInventory: (inventory: Inventory) => void;
  loadInventory: () => Promise<void>;
  getStock: (itemId: string) => number;
  isOutOfStock: (itemId: string) => boolean;
}

export const createInventorySlice: StateCreator<InventorySlice, [], [], InventorySlice> = (set, get) => ({
  inventory: {},

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

  getStock: (itemId) => get().inventory[itemId] ?? 0,

  isOutOfStock: (itemId) => {
    return (get().inventory[itemId] ?? 0) <= 0;
  },
});
