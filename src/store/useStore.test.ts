import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStore } from './useStore';
import { allItems } from '@shared/catalog';

// Mock fetch
const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

describe('useStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({ config: {}, cart: {}, inventory: {} });
    mockFetch.mockReset();
  });

  describe('loadInventory', () => {
    it('should load inventory on successful fetch', async () => {
      const mockInventory = { 'item-1': 5, 'item-2': 12 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInventory,
      });

      await useStore.getState().loadInventory();

      expect(useStore.getState().inventory).toEqual(mockInventory);
    });

    it('should retain existing inventory on fetch failure', async () => {
      // Set initial inventory
      const initialInventory = { 'item-1': 5, 'item-2': 12 };
      useStore.setState({ inventory: initialInventory });

      // Mock a failed fetch
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await useStore.getState().loadInventory();

      // State should be unchanged
      expect(useStore.getState().inventory).toEqual(initialInventory);
    });

    it('should use fallback inventory on fetch failure if store is empty (in dev mode)', async () => {
      // Vitest runs with import.meta.env.DEV = true by default.
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await useStore.getState().loadInventory();

      const state = useStore.getState();
      expect(Object.keys(state.inventory).length).toBeGreaterThan(0);
      
      // Check that a known item got the default stock of 10
      const firstItem = allItems[0]?.id;
      if (firstItem) {
        expect(state.inventory[firstItem]).toBe(10);
      }
    });
  });
});
