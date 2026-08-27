import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createConfigSlice, type ConfigSlice } from './slices/configSlice';
import { createCartSlice, type CartSlice } from './slices/cartSlice';
import { createInventorySlice, type InventorySlice } from './slices/inventorySlice';
import { calculatePartsTotal, calculateTotal } from '@shared/pricing';

export type AppStore = ConfigSlice & CartSlice & InventorySlice;

export const useStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createConfigSlice(...a),
      ...createCartSlice(...a),
      ...createInventorySlice(...a),
    }),
    {
      name: 'gcc-shop-storage',
      partialize: (state) => ({
        cart: state.cart,
        config: state.config,
        customBuilds: state.customBuilds,
      }),
    }
  )
);

// Derived State Selectors (to prevent infinite renders)
export const useCartTotal = () => useStore((state) => 
  calculatePartsTotal(state.cart) + state.customBuilds.reduce((sum, build) => sum + calculateTotal(build), 0)
);
export const useCartCount = () =>
  useStore((state) => Object.values(state.cart).reduce((sum, qty) => sum + qty, 0) + state.customBuilds.length);
