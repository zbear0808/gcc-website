import { describe, it, expect } from 'vitest';
import { toggleModLogic, updateCartQuantityLogic } from './logic';
import type { ConfiguratorState, Cart, Inventory } from '@shared/types';

describe('Store Logic (Pure Functions)', () => {
  describe('toggleModLogic', () => {
    it('toggles a mod on and off', () => {
      const config: ConfiguratorState = { product: 'full-build' };

      const enabled = toggleModLogic(config, 'notchesFirefox');
      expect(enabled.notchesFirefox).toBe(true);

      const disabled = toggleModLogic(enabled, 'notchesFirefox');
      expect(disabled.notchesFirefox).toBe(false);
    });

    it('mutually excludes notchesFirefox and notchesWavedash', () => {
      const config: ConfiguratorState = { product: 'full-build', notchesFirefox: true };

      const updated = toggleModLogic(config, 'notchesWavedash');
      expect(updated.notchesWavedash).toBe(true);
      expect(updated.notchesFirefox).toBe(false);

      const reverted = toggleModLogic(updated, 'notchesFirefox');
      expect(reverted.notchesFirefox).toBe(true);
      expect(reverted.notchesWavedash).toBe(false);
    });

    it('mutually excludes triggerPlugs and kailhChoco', () => {
      const config: ConfiguratorState = { product: 'full-build', kailhChoco: true };

      const updated = toggleModLogic(config, 'triggerPlugs');
      expect(updated.triggerPlugs).toBe(true);
      expect(updated.kailhChoco).toBe(false);

      const reverted = toggleModLogic(updated, 'kailhChoco');
      expect(reverted.kailhChoco).toBe(true);
      expect(reverted.triggerPlugs).toBe(false);
    });
  });

  describe('updateCartQuantityLogic', () => {
    const inventory: Inventory = {
      'item-in-stock': 5,
      'item-out-of-stock': 0,
    };

    it('adds an item to cart normally', () => {
      const cart: Cart = {};
      const newCart = updateCartQuantityLogic(cart, inventory, 'item-in-stock', 1);
      expect(newCart['item-in-stock']).toBe(1);
    });

    it('increments an existing item in cart', () => {
      const cart: Cart = { 'item-in-stock': 2 };
      const newCart = updateCartQuantityLogic(cart, inventory, 'item-in-stock', 1);
      expect(newCart['item-in-stock']).toBe(3);
    });

    it('prevents adding more than the inventory stock limit', () => {
      const cart: Cart = { 'item-in-stock': 5 };
      const newCart = updateCartQuantityLogic(cart, inventory, 'item-in-stock', 1);
      expect(newCart['item-in-stock']).toBe(5); // Should remain 5
    });

    it('prevents adding to an out-of-stock item', () => {
      const cart: Cart = {};
      const newCart = updateCartQuantityLogic(cart, inventory, 'item-out-of-stock', 1);
      expect(newCart['item-out-of-stock']).toBe(0);
    });

    it('prevents decrementing below zero', () => {
      const cart: Cart = { 'item-in-stock': 0 };
      const newCart = updateCartQuantityLogic(cart, inventory, 'item-in-stock', -1);
      expect(newCart['item-in-stock']).toBe(0);
    });

    it('uses a default stock of 99 if inventory is missing', () => {
      const cart: Cart = {};
      // 'missing-item' is not in inventory object
      const newCart = updateCartQuantityLogic(cart, inventory, 'missing-item', 10);
      expect(newCart['missing-item']).toBe(10);

      // Should stop at 99
      const maxedCart = updateCartQuantityLogic({ 'missing-item': 99 }, inventory, 'missing-item', 1);
      expect(maxedCart['missing-item']).toBe(99);
    });
  });
});
