import { describe, it, expect } from 'vitest';
import { calculateParcel } from './shipping';
import type { CheckoutPayload } from './types';

describe('Shipping', () => {
  describe('calculateParcel', () => {
    it('Small package: parts-only order -> small box (6x4x2)', () => {
      const payload: CheckoutPayload = {
        cart: { 'tactile-z': 1, 'notch-ruler': 1 },
        parts: true
      };
      const result = calculateParcel(payload);
      expect(result).toMatchObject({
        length: 6,
        width: 4,
        height: 2
      });
    });

    it('Medium box: single full-build with default config -> medium box (8x6x4)', () => {
      const payload: CheckoutPayload = {
        cart: { 'full-build': 1 }
      };
      const result = calculateParcel(payload);
      expect(result).toMatchObject({
        length: 8,
        width: 6,
        height: 4
      });
    });

    it('Medium box: single DIY kit -> medium box (8x6x4)', () => {
      const payload: CheckoutPayload = {
        cart: { 'diy-kit': 1 }
      };
      const result = calculateParcel(payload);
      expect(result).toMatchObject({
        length: 8,
        width: 6,
        height: 4
      });
    });

    it('Large box: 2 full builds via customBuilds -> large box (12x8x6)', () => {
      const payload: CheckoutPayload = {
        customBuilds: [
          // We can mock minimal config state, but usually customBuilds imply a 'full-build'
          // We'll let extractRequestedItems do its job by actually defining what extractRequestedItems returns.
          // Wait, extractRequestedItems will look at `customBuilds` and extract the items from it. 
          // If customBuilds just has `product: 'full-build'`, it should work.
          { product: 'full-build' } as any,
          { product: 'full-build' } as any
        ]
      };
      const result = calculateParcel(payload);
      expect(result).toMatchObject({
        length: 12,
        width: 8,
        height: 6
      });
    });

    it('Medium box with single build but NOT heavy enough for large (controllerCount=1, hasBulkyItems=true, weight <= 24)', () => {
      const payload: CheckoutPayload = {
        cart: { 'full-build': 1, 'indigo': 1 }
      };
      const result = calculateParcel(payload);
      expect(result).toMatchObject({
        length: 8,
        width: 6,
        height: 4
      });
    });

    it('Weight calculation: exact weight for a known config', () => {
      const payload: CheckoutPayload = {
        cart: { 'full-build': 1, 'indigo': 1, 'tactile-z': 1, 'notch-ruler': 1, 'board-only': 1 }
      };
      const result = calculateParcel(payload);
      // 12 (full-build) + 4 (indigo) + 1 (tactile-z) + 1 (notch-ruler) + 2 (board-only) = 20
      // 20 + 3 (packaging) = 23
      expect(result.weight).toBe(23);
    });

    it('Worn shell suffix stripping: wornShell on indigo gets indigo weight', () => {
      const payload: CheckoutPayload = {
        cart: { 'indigo-worn': 1, 'full-build': 1 }
      };
      const result = calculateParcel(payload);
      // indigo = 4, full-build = 12, packaging = 3. Total = 19
      expect(result.weight).toBe(19);
    });
  });
});
