# Technical Debt Resolution Plan: `src/store/logic.ts`

This document details the resolution plan for identified architectural, safety, and performance issues within [`src/store/logic.ts`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/src/store/logic.ts).

---

## Executive Summary

The pure functions in [`src/store/logic.ts`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/src/store/logic.ts) handle core state transitions for customer customization options and shopping cart updates. The following technical debt issues have been identified:

1. **Cart Zero-Quantity Bug**: Items reduced to quantity `0` remain in the `Cart` map with a value of `0` instead of being removed.
2. **Dangerous Inventory Fallback**: Missing inventory entries default to `99`, creating a risk of overselling unstocked items.
3. **Type Safety Gap**: `modId` parameter in `toggleModLogic` is typed broadly as `keyof ConfiguratorState`, permitting non-boolean field toggles.
4. **Unnecessary Object Allocation**: Sequential object spreads in `toggleModLogic` trigger multiple intermediate allocations during a single toggle operation.

---

## Detailed Issues & Resolution Plan

### 1. Cart Zero-Quantity Bug

#### Problem & Impact
In `updateCartQuantityLogic`, when decrementing an item's quantity to zero or lower, the function computes `newVal = Math.min(stock, Math.max(0, current + delta))` and returns `{ ...currentCart, [itemId]: newVal }`.
- **Impact**: Keys with quantity `0` (e.g., `{ "cable-paracord": 0 }`) persist in the cart state dictionary. This pollutes cart state, breaks zero-quantity item existence checks (`itemId in cart`), and risks passing zero-quantity items into checkout payloads or total price calculations.

#### Proposed Solution
When `newVal <= 0`, exclude `itemId` from the returned `Cart` object rather than assigning `0`.

```typescript
export function updateCartQuantityLogic(
  currentCart: Cart,
  inventory: Inventory,
  itemId: string,
  delta: number
): Cart {
  const current = currentCart[itemId] ?? 0;
  const stock = inventory[itemId] ?? 0;

  const newVal = Math.min(stock, Math.max(0, current + delta));

  if (newVal <= 0) {
    const { [itemId]: _, ...nextCart } = currentCart;
    return nextCart;
  }

  return { ...currentCart, [itemId]: newVal };
}
```

---

### 2. Dangerous Inventory Fallback (Defaults to 99)

#### Problem & Impact
Line 39 of [`src/store/logic.ts`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/src/store/logic.ts) reads:
```typescript
const stock = inventory[itemId] ?? 99;
```
- **Impact**: If inventory data has not loaded, is missing, or is unlisted for a particular item, the system permits customers to add up to 99 units to their cart. This poses a major commercial risk of overselling out-of-stock products or unlisted inventory items.

#### Proposed Solution
Change the fallback stock for unlisted/missing inventory items from `99` to `0`. If an item is not present in the inventory dictionary, it should default to unavailable (0 stock limit) unless explicitly defined.

```typescript
const stock = inventory[itemId] ?? 0;
```

---

### 3. Type Safety Gap (`modId` Loosely Typed)

#### Problem & Impact
`toggleModLogic` currently accepts `modId: keyof ConfiguratorState`:
```typescript
export function toggleModLogic(
  currentConfig: ConfiguratorState,
  modId: keyof ConfiguratorState
): ConfiguratorState
```
- **Impact**: `keyof ConfiguratorState` includes string/enum attributes (e.g., `shell`, `buttons`, `cable`, `notchStyle`, `triggerPlugSide`). Passing a string field to `toggleModLogic` (e.g. `toggleModLogic(config, 'shell')`) will compile cleanly but evaluate `!currentConfig['shell']` as a boolean, setting `shell: true` or `false` in state.

#### Proposed Solution
Define a strict `BooleanModKey` type that extracts only keys of `ConfiguratorState` whose values are boolean flags (`boolean | undefined`).

```typescript
export type BooleanModKey = {
  [K in keyof ConfiguratorState]-?: ConfiguratorState[K] extends boolean | undefined ? K : never;
}[keyof ConfiguratorState];
```

Update `toggleModLogic` and consumer signatures (such as `useStore.ts`'s `toggleMod`) to require `BooleanModKey`.

---

### 4. Unnecessary Object Allocation (Object Spread in Loops / Sequential Branches)

#### Problem & Impact
`toggleModLogic` constructs intermediate objects sequentially using object spread:
```typescript
let updated = { ...currentConfig, [modId]: newVal };

if (modId === 'notchesFirefox' && newVal) {
  updated = { ...updated, notchesWavedash: false };
}
if (modId === 'notchesWavedash' && newVal) {
  updated = { ...updated, notchesFirefox: false };
}
if (modId === 'triggerPlugs' && newVal) {
  updated = { ...updated, kailhChoco: false };
}
if (modId === 'kailhChoco') {
  updated = { ...updated, triggerPlugs: false, detachableTriggerPaddle: false };
}
if (modId === 'detachableTriggerPaddle' && newVal) {
  updated = { ...updated, kailhChoco: false };
}
```
- **Impact**: Up to 4 intermediate shallow copies of `ConfiguratorState` are allocated on heap memory for a single toggle call. This creates garbage collection overhead during frequent toggle actions.

#### Proposed Solution
Collect property mutations in a single `Partial<ConfiguratorState>` delta object and perform a single merge with `currentConfig`:

```typescript
export function toggleModLogic(
  currentConfig: ConfiguratorState,
  modId: BooleanModKey
): ConfiguratorState {
  const current = currentConfig[modId] as boolean | undefined;
  const newVal = !current;

  const updates: Partial<ConfiguratorState> = { [modId]: newVal };

  if (newVal) {
    switch (modId) {
      case 'notchesFirefox':
        updates.notchesWavedash = false;
        break;
      case 'notchesWavedash':
        updates.notchesFirefox = false;
        break;
      case 'triggerPlugs':
        updates.kailhChoco = false;
        break;
      case 'kailhChoco':
        updates.triggerPlugs = false;
        updates.detachableTriggerPaddle = false;
        break;
      case 'detachableTriggerPaddle':
        updates.kailhChoco = false;
        break;
    }
  }

  return sanitizeConfig({ ...currentConfig, ...updates });
}
```

---

## Refactored Implementation Plan

1. **Update [`src/store/logic.ts`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/src/store/logic.ts)**:
   - Export `BooleanModKey` type helper.
   - Refactor `toggleModLogic` with `BooleanModKey` type constraint and `updates` delta object.
   - Refactor `updateCartQuantityLogic` to fallback missing inventory to `0` and delete items when `newVal <= 0`.

2. **Update Associated Files**:
   - [`src/store/useStore.ts`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/src/store/useStore.ts): Update `toggleMod` parameter type to `BooleanModKey`.
   - [`src/store/logic.test.ts`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/src/store/logic.test.ts): Update unit tests to verify:
     - Cart item deletion on zero quantity.
     - Fallback inventory behavior (0 stock for missing item).
     - Single-pass state transitions for mutually exclusive mods.

---

## Verification & Testing Plan

Run tests via `vitest`:
```bash
npx vitest run src/store/logic.test.ts
```
Verify all edge cases pass:
- Toggling mods mutually excludes conflicting options correctly.
- Decrementing cart quantity to 0 removes the key from the cart object.
- Adding unlisted inventory items does not allow quantity additions beyond 0.
