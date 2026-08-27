import type { StateCreator } from 'zustand';
import type { Cart } from '@shared/types';
import { updateCartQuantityLogic } from '../logic';
import type { InventorySlice } from './inventorySlice';
import type { ConfigSlice } from './configSlice';
import { sanitizeConfig } from '@shared/pricing';

export interface CartSlice {
  cart: Cart;
  addToCart: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
}

export const createCartSlice: StateCreator<CartSlice & ConfigSlice & InventorySlice, [], [], CartSlice> = (set) => ({
  cart: {},

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
    set((state) => ({
      cart: updateCartQuantityLogic(state.cart, state.inventory, itemId, delta),
    })),

  clearCart: () => set({ cart: {}, customBuilds: [], config: sanitizeConfig({ product: 'full-build' }) }),
});
