# Resolution Plan: useStore.ts

## Overview
This document outlines the technical debt resolution plan for [`src/store/useStore.ts`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/src/store/useStore.ts). The goal is to eliminate inventory bypass bugs, clean up redundant/misnamed cart methods, reduce excessive config boilerplate, eliminate unexpected side effects in cart reset operations, and improve production error handling and state tracking for inventory fetching.

---

## 1. Bug Fix: Inventory Bypass in `addToCart`

### Description
Currently, `addToCart(itemId)` increments item quantity directly without checking inventory stock limits:
```ts
addToCart: (itemId) =>
  set((state) => ({
    cart: { ...state.cart, [itemId]: (state.cart[itemId] ?? 0) + 1 },
  })),
```
This allows users to bypass stock limits and add items beyond available inventory.

### Solution
Delegate `addToCart` to `updateCartQuantityLogic` or enforce inventory limits using `state.inventory[itemId]`:
```ts
addToCart: (itemId) =>
  set((state) => ({
    cart: updateCartQuantityLogic(state.cart, state.inventory, itemId, 1),
  })),
```
- If stock is insufficient or item is out of stock, `addToCart` will capped at available stock.

---

## 2. Refactor: Misnamed and Redundant `removeFromCart`

### Description
1. `removeFromCart` currently decrements item quantity by 1 (`Math.max(0, qty - 1)`), which duplicates `updateCartQuantity(itemId, -1)`.
2. The name `removeFromCart` implies removing the item completely from the cart object, not just decrementing its quantity.
3. Decrementing to `0` leaves `{ [itemId]: 0 }` in the cart dictionary instead of removing the key, resulting in stale data in state.

### Solution
1. Redefine `removeFromCart(itemId)` to remove the key entirely from `cart`:
   ```ts
   removeFromCart: (itemId) =>
     set((state) => {
       const { [itemId]: _, ...rest } = state.cart;
       return { cart: rest };
     }),
   ```
2. Update `updateCartQuantityLogic` so that setting quantity to `0` automatically deletes the item key from the `cart` dictionary instead of storing `0`.
3. Use `updateCartQuantity(itemId, -1)` when decrementing unit count in UI controls.

---

## 3. Architecture: Excessive Boilerplate in Config Actions

### Description
`useStore.ts` contains 13 individual config setter actions (`setProduct`, `setShell`, `setButtons`, `setCable`, `setRumble`, `setSliderPots`, `setZButton`, `setMembrane`, `setStickCap`, `setNotchStyle`, `setTriggerSide`, `setTriggerLength`, `setkailhChocoSide`), each repeating the identical wrapper logic around `sanitizeConfig`.

### Solution
1. Introduce a single, type-safe `updateConfigField` method on `AppStore`:
   ```ts
   updateConfigField: <K extends keyof ConfiguratorState>(
     key: K,
     value: ConfiguratorState[K]
   ) => void;
   ```
2. Refactor store implementation to utilize `updateConfigField` internally, while retaining optional helper aliases if needed for backward compatibility.

---

## 4. Fix: Unexpected Side Effects in `clearCart`

### Description
`clearCart` currently performs three unrelated resets simultaneously:
```ts
clearCart: () => set({ cart: {}, customBuilds: [], config: sanitizeConfig({ product: 'full-build' }) }),
```
Clearing the cart unexpectedly wipes out `customBuilds` and resets the user's active configurator selection (`config`).

### Solution
1. Isolate `clearCart()` to only clear cart contents:
   ```ts
   clearCart: () => set({ cart: {} }),
   ```
2. Provide distinct, dedicated store actions for independent state resets:
   - `clearCustomBuilds: () => set({ customBuilds: [] })`
   - `resetConfig: () => set({ config: sanitizeConfig({ product: 'full-build' }) })`

---

## 5. Reliability: Opaque Production Error Handling & Inventory State

### Description
`loadInventory` currently catches fetch failures and logs a warning, but in production (`import.meta.env.DEV === false`) when `inventory` is empty, it fails silently without setting any error or loading state. UI components have no way to know if inventory loading failed or is in progress.

### Solution
1. Add `isLoadingInventory: boolean` and `inventoryError: string | null` to `AppStore` state interface.
2. Update `loadInventory` to manage loading and error state cleanly:
   ```ts
   loadInventory: async () => {
     set({ isLoadingInventory: true, inventoryError: null });
     try {
       const res = await fetch(`${API_BASE}/api/inventory`);
       if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
       const data = await res.json();
       set({ inventory: data, isLoadingInventory: false });
     } catch (err) {
       const message = err instanceof Error ? err.message : 'Failed to fetch inventory';
       console.warn('Failed to fetch inventory from server:', message);

       const currentInventory = get().inventory;
       if (Object.keys(currentInventory).length === 0 && import.meta.env.DEV) {
         const fallback: Inventory = {};
         for (const item of allItems) {
           fallback[item.id] = 10;
         }
         set({ inventory: fallback, isLoadingInventory: false });
       } else {
         set({ inventoryError: message, isLoadingInventory: false });
       }
     }
   }
   ```

---

## Step-by-Step Implementation Roadmap

1. **Step 1: Update `AppStore` Interface**
   Add `isLoadingInventory`, `inventoryError`, `updateConfigField`, `clearCustomBuilds`, `resetConfig` to interface.

2. **Step 2: Refactor Cart Logic & Inventory Checks**
   - Fix `addToCart` to call `updateCartQuantityLogic(state.cart, state.inventory, itemId, 1)`.
   - Update `removeFromCart` to delete the item key from `cart`.
   - Refactor `updateCartQuantityLogic` in `src/store/logic.ts` to prune zero-quantity keys.

3. **Step 3: Refactor Config Actions & Eliminate Boilerplate**
   Implement `updateConfigField` and simplify individual config action definitions.

4. **Step 4: Decouple `clearCart` Side Effects**
   Limit `clearCart` to `cart: {}` and introduce `resetConfig` and `clearCustomBuilds`.

5. **Step 5: Enhance Inventory Loading & Error Handling**
   Update `loadInventory` to set `isLoadingInventory` and `inventoryError` properly.

6. **Step 6: Update Unit Tests**
   Add unit tests in [`src/store/useStore.test.ts`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/src/store/useStore.test.ts) covering inventory limits on `addToCart`, key deletion on `removeFromCart`, `clearCart` isolation, and inventory error states.

---

## Verification & Testing Plan

1. **Unit Tests**: Run `npm run test` or `npx vitest run src/store/useStore.test.ts` to ensure all existing and new tests pass.
2. **TypeScript Compilation**: Run `npx tsc --noEmit` to verify type safety across store consumers.
3. **Manual Verification**: Test adding items beyond stock limits, removing items from cart, clearing cart without losing active config, and loading inventory.
