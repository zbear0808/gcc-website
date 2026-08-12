# Resolution Plan for `logic.test.ts`

## Executive Summary
This document outlines the step-by-step resolution plan to address testing deficiencies in [`src/store/logic.test.ts`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/src/store/logic.test.ts).

The two main issues to resolve are:
1. **Codifying Anti-patterns (Phantom Key Bug)**: The current test suite explicitly asserts that items with 0 quantity remain present as keys with value `0` in the `Cart` object. The tests should enforce that zero-quantity items are cleaned up or omitted from the cart state.
2. **Missing Edge Case Tests**: Critical runtime edge cases in both `toggleModLogic` and `updateCartQuantityLogic` are unhedged, including handling unknown keys, complex mutual exclusion rules, non-existent cart items, and extreme stock limits.

---

## 1. Codifying Anti-patterns (Phantom Key Bug)

### Context & Problem
In `logic.test.ts`, several test cases assert that setting an item quantity to `0` or attempting to add an out-of-stock item results in a cart object with `'item-key': 0`:

```typescript
// CURRENT (Anti-pattern in logic.test.ts):
it('prevents adding to an out-of-stock item', () => {
  const cart: Cart = {};
  const newCart = updateCartQuantityLogic(cart, inventory, 'item-out-of-stock', 1);
  expect(newCart['item-out-of-stock']).toBe(0); // Phantom key created!
});

it('prevents decrementing below zero', () => {
  const cart: Cart = { 'item-in-stock': 0 };
  const newCart = updateCartQuantityLogic(cart, inventory, 'item-in-stock', -1);
  expect(newCart['item-in-stock']).toBe(0); // Phantom key preserved!
});
```

Keeping keys with quantity `0` pollutes state, complicates `Object.keys(cart)` iterations, breaks badge counters (e.g., `Object.values(cart).length`), and forces UI components to constantly check `if (quantity > 0)`.

### Resolution Strategy
1. **Refactor existing test assertions in `logic.test.ts`**:
   - Out-of-stock item additions must leave the cart unchanged (`expect('item-out-of-stock' in newCart).toBe(false)` and `expect(newCart['item-out-of-stock']).toBeUndefined()`).
   - Decrementing an item quantity to 0 or below must remove the key from the returned `Cart` object entirely (`expect(newCart['item-in-stock']).toBeUndefined()`).
2. **Target Implementation Update**:
   - Note that updating these test assertions will require corresponding logic changes in [`src/store/logic.ts`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/src/store/logic.ts) so `updateCartQuantityLogic` deletes/omits keys when `newVal <= 0`.

---

## 2. Missing Edge Case Tests

### Edge Cases for `toggleModLogic`

1. **Graceful Handling of Unknown / Invalid `modId`**:
   - **Scenario**: A string that is not a valid key of `ConfiguratorState` is passed at runtime (cast via `as keyof ConfiguratorState`).
   - **Expected behavior**: The function should not throw errors, should retain original valid state, and should not pollute state with unknown key properties.

2. **Chained Mutual Exclusion (`kailhChoco` & `detachableTriggerPaddle`)**:
   - **Scenario**: Toggle `kailhChoco` on when `detachableTriggerPaddle` is already `true`.
   - **Expected behavior**: Enabling `kailhChoco` should automatically set both `triggerPlugs` and `detachableTriggerPaddle` to `false`.

### Edge Cases for `updateCartQuantityLogic`

1. **Decrementing Non-existent Cart Items**:
   - **Scenario**: Call `updateCartQuantityLogic({}, inventory, 'item-in-stock', -5)` on an empty cart.
   - **Expected behavior**: Returns an empty cart `{}` without creating a phantom key or throwing errors.

2. **Stock Limit Boundaries & Oversized Deltas**:
   - **Scenario**: Adding a delta of `+100` when inventory stock is `5`.
   - **Expected behavior**: Capped exactly at `5`, no overflow.

3. **Fallback Stock Behavior**:
   - **Scenario**: Items missing from `inventory` default to stock `99`. Verify boundary behavior when adding `+100` to a missing item (caps at `99`).

4. **Zero & Negative Stock Limits**:
   - **Scenario**: Explicit stock of `0` in inventory object.
   - **Expected behavior**: Attempting any positive delta returns the cart without adding the item key.

---

## Plan Checklist & Verification Steps
- [ ] Update `logic.test.ts` phantom key assertions to check for key absence (`toBeUndefined()`).
- [ ] Add `describe('toggleModLogic edge cases')` test blocks for unknown mod keys and multi-exclusion behavior.
- [ ] Add `describe('updateCartQuantityLogic edge cases')` test blocks for non-existent item decrements, stock caps, and fallback values.
- [ ] Run `npm run test` or `npx vitest src/store/logic.test.ts` to verify test suite results.
