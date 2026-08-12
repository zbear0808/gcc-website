import { describe, it, expect } from 'vitest';
import { validateInventory, calculateStripeAmount } from './order-logic';
import type { StripeLineItem } from './types';

describe('Order Logic (Pure Functions)', () => {
  describe('validateInventory', () => {
    it('returns empty array when all items are in stock', () => {
      const requestedItems = {
        'item-a': 2,
        'item-b': 1,
      };
      const currentInventory = {
        'item-a': 5,
        'item-b': 1,
      };
      const outOfStock = validateInventory(requestedItems, currentInventory);
      expect(outOfStock).toEqual([]);
    });

    it('returns array of item IDs when items are out of stock', () => {
      const requestedItems = {
        'item-a': 2,
        'item-b': 5,
        'item-c': 1, // Missing from inventory completely
      };
      const currentInventory = {
        'item-a': 1, // Short
        'item-b': 10, // OK
      };
      const outOfStock = validateInventory(requestedItems, currentInventory);
      
      expect(outOfStock).toContain('item-a');
      expect(outOfStock).toContain('item-c');
      expect(outOfStock).not.toContain('item-b');
      expect(outOfStock.length).toBe(2);
    });
  });

  describe('calculateStripeAmount', () => {
    it('correctly sums up multiple line items with quantities', () => {
      const lineItems: StripeLineItem[] = [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Item 1' },
            unit_amount: 1000, // $10
          },
          quantity: 2,
        },
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Item 2' },
            unit_amount: 500, // $5
          },
          quantity: 1,
        },
      ];

      const total = calculateStripeAmount(lineItems);
      // (1000 * 2) + (500 * 1) = 2500
      expect(total).toBe(2500);
    });

    it('returns 0 for empty array', () => {
      const total = calculateStripeAmount([]);
      expect(total).toBe(0);
    });
  });

  describe('validateInventory - Edge Cases', () => {
    it('does not flag items with zero or negative requested quantities', () => {
      const requestedItems = { 'item-a': 0, 'item-b': -2 };
      const currentInventory = { 'item-a': 0, 'item-b': 0 };
      const outOfStock = validateInventory(requestedItems, currentInventory);
      expect(outOfStock).toEqual([]);
    });

    it('flags items with explicitly zero stock when 1 is requested', () => {
      const requestedItems = { 'item-a': 1 };
      const currentInventory = { 'item-a': 0 };
      const outOfStock = validateInventory(requestedItems, currentInventory);
      expect(outOfStock).toEqual(['item-a']);
    });

    it('flags all requested items when inventory is empty', () => {
      const requestedItems = { 'item-a': 1, 'item-b': 3 };
      const currentInventory = {};
      const outOfStock = validateInventory(requestedItems, currentInventory);
      expect(outOfStock).toContain('item-a');
      expect(outOfStock).toContain('item-b');
      expect(outOfStock.length).toBe(2);
    });

    it('returns empty array when requestedItems is empty', () => {
      const outOfStock = validateInventory({}, { 'item-a': 10 });
      expect(outOfStock).toEqual([]);
    });

    it('passes when requested quantity exactly equals available stock', () => {
      const requestedItems = { 'item-a': 5 };
      const currentInventory = { 'item-a': 5 };
      const outOfStock = validateInventory(requestedItems, currentInventory);
      expect(outOfStock).toEqual([]);
    });
  });

  describe('calculateStripeAmount - Edge Cases', () => {
    it('handles zero-quantity and zero-amount line items', () => {
      const lineItems: StripeLineItem[] = [
        {
          price_data: { currency: 'usd', product_data: { name: 'Free Gift' }, unit_amount: 0 },
          quantity: 1,
        },
        {
          price_data: { currency: 'usd', product_data: { name: 'Zero Qty' }, unit_amount: 2500 },
          quantity: 0,
        },
      ];
      expect(calculateStripeAmount(lineItems)).toBe(0);
    });

    it('handles negative unit_amount for discount line items', () => {
      const lineItems: StripeLineItem[] = [
        {
          price_data: { currency: 'usd', product_data: { name: 'Widget' }, unit_amount: 2000 },
          quantity: 1,
        },
        {
          price_data: { currency: 'usd', product_data: { name: 'Discount' }, unit_amount: -500 },
          quantity: 1,
        },
      ];
      expect(calculateStripeAmount(lineItems)).toBe(1500);
    });

    it('handles large amounts without precision loss', () => {
      const lineItems: StripeLineItem[] = [
        {
          price_data: { currency: 'usd', product_data: { name: 'Expensive Item' }, unit_amount: 99999 },
          quantity: 100,
        },
      ];
      expect(calculateStripeAmount(lineItems)).toBe(9999900);
    });
  });
});
