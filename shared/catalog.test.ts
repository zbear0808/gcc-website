import { describe, it, expect } from 'vitest';
import { getCategoryIdForItem } from './catalog';

describe('Catalog', () => {
  describe('getCategoryIdForItem', () => {
    it("A shell item ('indigo') returns 'shells'", () => {
      expect(getCategoryIdForItem('indigo')).toBe('shells');
    });

    it("A button item ('oem-buttons') returns 'buttons'", () => {
      expect(getCategoryIdForItem('oem-buttons')).toBe('buttons');
    });

    it("A stick cap item ('gc-cap-good') returns 'stick-caps'", () => {
      expect(getCategoryIdForItem('gc-cap-good')).toBe('stick-caps');
    });

    it("A rumble motor ('rumble-oem') returns 'rumble-motors'", () => {
      expect(getCategoryIdForItem('rumble-oem')).toBe('rumble-motors');
    });

    it("An individual part ('board-only') returns its own id 'board-only'", () => {
      expect(getCategoryIdForItem('board-only')).toBe('board-only');
    });

    it("A nonexistent item returns undefined", () => {
      expect(getCategoryIdForItem('nonexistent-item')).toBeUndefined();
    });

    it("A cable ('cable-paracord-3m') returns 'cables'", () => {
      expect(getCategoryIdForItem('cable-paracord-3m')).toBe('cables');
    });
  });
});
