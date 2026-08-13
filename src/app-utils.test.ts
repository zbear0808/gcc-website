import { describe, it, expect } from 'vitest';
import { getRouteTitle } from './App';

describe('App utils', () => {
  describe('getRouteTitle', () => {
    it('returns correct title for /', () => {
      expect(getRouteTitle('/')).toBe('Zu Builds | Builds');
    });

    it('returns correct title for /parts', () => {
      expect(getRouteTitle('/parts')).toBe('Zu Builds | Parts');
    });

    it('returns correct title for /faq', () => {
      expect(getRouteTitle('/faq')).toBe('Zu Builds | FAQ');
    });

    it('returns correct title for /cart', () => {
      expect(getRouteTitle('/cart')).toBe('Zu Builds | Cart');
    });

    it('returns correct title for /checkout', () => {
      expect(getRouteTitle('/checkout')).toBe('Zu Builds | Checkout');
    });

    it('returns correct title for /admin', () => {
      expect(getRouteTitle('/admin')).toBe('Zu Builds | Admin');
    });

    it('returns correct title for product routes', () => {
      expect(getRouteTitle('/product/shells')).toBe('Zu Builds | Product');
      expect(getRouteTitle('/product/buttons')).toBe('Zu Builds | Product');
    });

    it('returns default title for unknown routes', () => {
      expect(getRouteTitle('/unknown')).toBe('Zu Builds');
      expect(getRouteTitle('/something/else')).toBe('Zu Builds');
    });
  });
});
