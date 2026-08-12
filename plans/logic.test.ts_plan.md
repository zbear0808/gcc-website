# Plan: Resolve Issues in `store/logic.test.ts`

This plan outlines the steps required to address the two primary issues identified in the `logic.test.ts` test suite.

## 1. Codifying Anti-patterns (Phantom Key Bug)
**Context:**
Currently, `updateCartQuantityLogic` leaves a phantom key in the cart when the quantity of an item becomes `0`, and the tests explicitly enforce this behavior. This is an anti-pattern as items with zero quantity should ideally be removed from the cart entirely to avoid cluttering the state and causing potential UI bugs.

**Proposed Changes:**
We need to update the assertions in `logic.test.ts` to expect that keys with a quantity of `0` are either `undefined` or entirely absent from the returned `Cart` object. 

*Note: This will cause the tests to fail until the actual implementation of `updateCartQuantityLogic` in `logic.ts` is also updated to omit or delete the key when the quantity resolves to `0`.*

**Code Snippets (Modifications to `logic.test.ts`):**

```typescript
    it('prevents adding to an out-of-stock item (avoids phantom key)', () => {
      const cart: Cart = {};
      const newCart = updateCartQuantityLogic(cart, inventory, 'item-out-of-stock', 1);
      
      // Assert that the key doesn't get added with a value of 0
      expect(newCart['item-out-of-stock']).toBeUndefined();
      expect('item-out-of-stock' in newCart).toBe(false);
    });

    it('removes item from cart when decremented to zero', () => {
      const cart: Cart = { 'item-in-stock': 1 };
      const newCart = updateCartQuantityLogic(cart, inventory, 'item-in-stock', -1);
      
      // Assert the key is removed instead of remaining with a value of 0
      expect(newCart['item-in-stock']).toBeUndefined();
      expect('item-in-stock' in newCart).toBe(false);
    });
```

## 2. Missing Edge Case Tests for `toggleModLogic`
**Context:**
`toggleModLogic` takes a `modId` argument which is typed as `keyof ConfiguratorState`. However, at runtime, a loose string could potentially be passed in (e.g., from user input or a deeply nested UI component). The test suite currently lacks assertions for how the function handles invalid or unknown mod IDs.

**Proposed Changes:**
Add a new test inside the `describe('toggleModLogic')` block that passes an invalid string (bypassing TypeScript's strict typing constraints using type casting) to observe how it reacts. We want to ensure that the application handles this gracefully, does not crash, and ideally that `sanitizeConfig` filters out the unexpected key.

**Code Snippet (Additions to `logic.test.ts`):**

```typescript
    it('handles invalid or unknown modId gracefully', () => {
      const config: ConfiguratorState = { product: 'full-build' };
      
      // Bypass TypeScript checking to simulate an invalid runtime string
      const invalidModId = 'someUnknownMod' as keyof ConfiguratorState;
      
      // Execute the function
      const updated = toggleModLogic(config, invalidModId);
      
      // Assert that the function does not throw and returns a stable state
      expect(updated).toBeDefined();
      expect(updated.product).toBe('full-build');
      
      // Verify that the unknown key did not pollute the new state object
      expect((updated as any).someUnknownMod).toBeUndefined();
    });
```
