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
});
