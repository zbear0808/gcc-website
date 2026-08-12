# useStore.test.ts Refactoring Plan

## 1. Fix Mocking Anti-pattern

**Problem:** The current test file uses `(globalThis as any).fetch = mockFetch;` which is considered an anti-pattern.
**Solution:** Use Vitest's built-in `vi.stubGlobal('fetch', mockFetch)` within the `beforeEach` block.

**Snippet:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();

describe('useStore', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    // Reset store state before each test
    useStore.setState({ 
      config: { product: 'full-build' }, 
      cart: {}, 
      inventory: {}, 
      customBuilds: [] 
    });
    mockFetch.mockReset();
  });
  
  afterEach(() => {
    vi.unstubAllGlobals();
  });
```

## 2. Implement Missing Test Coverage for Config Actions

**Problem:** Core state mutations for configuring builds are untested.
**Solution:** Add a `describe('Config Actions')` block testing actions like `setProduct`, `setShell`, `setButtons`, and `toggleMod`.

**Snippet:**
```typescript
  describe('Config Actions', () => {
    it('should set product', () => {
      useStore.getState().setProduct('phob-2-0-5');
      expect(useStore.getState().config.product).toBe('phob-2-0-5');
    });

    it('should set shell', () => {
      useStore.getState().setShell('oem-black');
      expect(useStore.getState().config.shell).toBe('oem-black');
    });

    it('should toggle mods', () => {
      useStore.getState().toggleMod('tactile-z');
      expect(useStore.getState().config.mods).toContain('tactile-z');
      
      // Toggling again should remove it
      useStore.getState().toggleMod('tactile-z');
      expect(useStore.getState().config.mods).not.toContain('tactile-z');
    });
  });
```

## 3. Implement Missing Test Coverage for Cart Actions

**Problem:** The cart logic is untested.
**Solution:** Add a `describe('Cart Actions')` block testing `addToCart`, `updateCartQuantity`, `removeFromCart`, `addCustomBuild`, and `clearCart`.

**Snippet:**
```typescript
  describe('Cart Actions', () => {
    it('should add items to cart and increment quantity', () => {
      useStore.getState().addToCart('item-1');
      expect(useStore.getState().cart['item-1']).toBe(1);

      useStore.getState().addToCart('item-1');
      expect(useStore.getState().cart['item-1']).toBe(2);
    });

    it('should remove items from cart and not go below 0', () => {
      useStore.setState({ cart: { 'item-1': 1 } });
      useStore.getState().removeFromCart('item-1');
      expect(useStore.getState().cart['item-1']).toBe(0);

      useStore.getState().removeFromCart('item-1');
      expect(useStore.getState().cart['item-1']).toBe(0);
    });

    it('should clear cart and reset related state', () => {
      useStore.setState({
        cart: { 'item-1': 2 },
        customBuilds: [{ product: 'full-build' }],
        config: { product: 'phob' }
      });

      useStore.getState().clearCart();

      const state = useStore.getState();
      expect(state.cart).toEqual({});
      expect(state.customBuilds).toEqual([]);
      expect(state.config.product).toBe('full-build');
    });
  });
```

## 4. Implement Missing Test Coverage for Helpers

**Problem:** Computed helper functions like `cartCount`, `cartTotal`, `getStock`, and `isOutOfStock` are completely untested.
**Solution:** Add a `describe('Helpers')` block testing these functions. `cartTotal` indirectly depends on `@shared/pricing` calculation, but the logic should handle checking the computed properties.

**Snippet:**
```typescript
  describe('Helpers', () => {
    it('should calculate cartCount correctly', () => {
      useStore.setState({
        cart: { 'item-1': 2, 'item-2': 3 },
        customBuilds: [{ product: 'full-build' } as any]
      });
      // 2 + 3 + 1 (custom build) = 6
      expect(useStore.getState().cartCount()).toBe(6);
    });

    it('should correctly determine stock status', () => {
      useStore.setState({
        inventory: { 'item-1': 5, 'item-2': 0 }
      });

      expect(useStore.getState().getStock('item-1')).toBe(5);
      expect(useStore.getState().isOutOfStock('item-1')).toBe(false);

      expect(useStore.getState().getStock('item-2')).toBe(0);
      expect(useStore.getState().isOutOfStock('item-2')).toBe(true);

      // Unknown item should default to 0 and be out of stock
      expect(useStore.getState().getStock('item-unknown')).toBe(0);
      expect(useStore.getState().isOutOfStock('item-unknown')).toBe(true);
    });
  });
```
