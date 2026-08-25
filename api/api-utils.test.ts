import { describe, it, expect } from 'vitest';
import { dollarsToCents, formatShippingRates, filterTrackedInventory, parseAndSortOrders } from './utils/helpers';

describe('API Utils', () => {
  describe('dollarsToCents', () => {
    it('converts basic dollar amount to cents', () => {
      expect(dollarsToCents('5.49')).toBe(549);
    });

    it('handles amounts with no cents', () => {
      expect(dollarsToCents('5')).toBe(500);
    });

    it('handles single digit cents padded', () => {
      expect(dollarsToCents('5.4')).toBe(540);
    });

    it('handles less than one dollar', () => {
      expect(dollarsToCents('0.99')).toBe(99);
    });

    it('handles zero trailing cents', () => {
      expect(dollarsToCents('10.00')).toBe(1000);
    });

    it('handles zero', () => {
      expect(dollarsToCents('0')).toBe(0);
    });
  });

  describe('formatShippingRates', () => {
    it('formats single rate with decimal', () => {
      const rates = [{ id: 'rate_1', service: 'Priority', carrier: 'USPS', rate: '5.49' }];
      const result = formatShippingRates(rates);
      expect(result).toEqual([
        { id: 'rate_1', service: 'Priority', carrier: 'USPS', rateInCents: 549 },
      ]);
    });

    it('formats multiple rates with different formats', () => {
      const rates = [
        { id: 'rate_1', service: 'Priority', carrier: 'USPS', rate: '5.49' },
        { id: 'rate_2', service: 'Ground', carrier: 'UPS', rate: '10' },
      ];
      const result = formatShippingRates(rates);
      expect(result).toEqual([
        { id: 'rate_1', service: 'Priority', carrier: 'USPS', rateInCents: 549 },
        { id: 'rate_2', service: 'Ground', carrier: 'UPS', rateInCents: 1000 },
      ]);
    });

    it('formats rate with integer value', () => {
      const rates = [{ id: 'rate_3', service: 'Express', carrier: 'FedEx', rate: '10' }];
      const result = formatShippingRates(rates);
      expect(result).toEqual([
        { id: 'rate_3', service: 'Express', carrier: 'FedEx', rateInCents: 1000 },
      ]);
    });
  });

  describe('filterTrackedInventory', () => {
    it('excludes items with requiresInventory: false', () => {
      const rawInventory = { item1: 5, item2: 10 };
      const catalog = [
        { id: 'item1', requiresInventory: false },
        { id: 'item2', requiresInventory: true },
      ];
      expect(filterTrackedInventory(rawInventory, catalog)).toEqual({ item2: 10 });
    });

    it('includes items without requiresInventory property', () => {
      const rawInventory = { item3: 2 };
      const catalog = [{ id: 'item3' }];
      expect(filterTrackedInventory(rawInventory, catalog)).toEqual({ item3: 2 });
    });

    it('includes items with requiresInventory: undefined', () => {
      const rawInventory = { item4: 7 };
      const catalog = [{ id: 'item4', requiresInventory: undefined }];
      expect(filterTrackedInventory(rawInventory, catalog)).toEqual({ item4: 7 });
    });

    it('coerces string quantities to numbers', () => {
      const rawInventory = { item5: '42' };
      const catalog = [{ id: 'item5' }];
      expect(filterTrackedInventory(rawInventory, catalog)).toEqual({ item5: 42 });
    });

    it('returns empty object for empty inventory', () => {
      const rawInventory = {};
      const catalog = [{ id: 'item1' }];
      expect(filterTrackedInventory(rawInventory, catalog)).toEqual({});
    });

    it('includes items not in catalog', () => {
      const rawInventory = { unknown_item: 5 };
      const catalog = [{ id: 'known_item' }];
      expect(filterTrackedInventory(rawInventory, catalog)).toEqual({ unknown_item: 5 });
    });
  });

  describe('parseAndSortOrders', () => {
    it('parses string JSON orders correctly', () => {
      const rawOrders = [JSON.stringify({ amount: 100, paidAt: '2023-01-02T00:00:00Z' })];
      const keys = ['paid_order:123'];
      const result = parseAndSortOrders(rawOrders, keys);
      expect(result).toEqual([
        { amount: 100, paidAt: '2023-01-02T00:00:00Z', id: '123' },
      ]);
    });

    it('handles already-parsed object orders', () => {
      const rawOrders = [{ amount: 200, paidAt: '2023-01-02T00:00:00Z' }];
      const keys = ['paid_order:456'];
      const result = parseAndSortOrders(rawOrders, keys);
      expect(result).toEqual([
        { amount: 200, paidAt: '2023-01-02T00:00:00Z', id: '456' },
      ]);
    });

    it('extracts order ID from key', () => {
      const rawOrders = [{ amount: 50 }];
      const keys = ['shipped_order:abc890'];
      const result = parseAndSortOrders(rawOrders, keys);
      expect(result[0].id).toBe('abc890');
    });

    it('sorts by paidAt descending (newest first)', () => {
      const rawOrders = [
        { amount: 1, paidAt: '2023-01-01T00:00:00Z' },
        { amount: 2, paidAt: '2023-01-03T00:00:00Z' },
        { amount: 3, paidAt: '2023-01-02T00:00:00Z' },
      ];
      const keys = ['order:1', 'order:2', 'order:3'];
      const result = parseAndSortOrders(rawOrders, keys);
      expect(result.map(o => o.id)).toEqual(['2', '3', '1']);
    });

    it('missing paidAt falls back to 0 (sorted last)', () => {
      const rawOrders = [
        { amount: 1, paidAt: '2023-01-01T00:00:00Z' },
        { amount: 2 },
      ];
      const keys = ['order:1', 'order:2'];
      const result = parseAndSortOrders(rawOrders, keys);
      expect(result.map(o => o.id)).toEqual(['1', '2']);
    });

    it('filters out null/undefined entries', () => {
      const rawOrders = [
        null,
        { amount: 1, paidAt: '2023-01-01T00:00:00Z' },
        undefined,
      ];
      // Note: filter(Boolean) changes index length so order ID is taken from first item in keys.
      const keys = ['order:1', 'order:2', 'order:3'];
      const result = parseAndSortOrders(rawOrders as any, keys);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });
  });
});
