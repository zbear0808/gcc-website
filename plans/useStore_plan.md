# Plan: `useStore.ts` Fixes

## 1. Inventory Bypass Bug in `addToCart`
**Issue:** `addToCart` increments the item quantity manually without considering the available inventory stock.
**Solution:** Refactor the `addToCart` action to use the `updateCartQuantityLogic` helper. This ensures stock checks and limits are correctly applied when an item is added to the cart.
**Code snippet:**
```typescript
addToCart: (itemId) =>
  set((state) => ({
    cart: updateCartQuantityLogic(state.cart, state.inventory, itemId, 1),
  })),
```

## 2. Misnamed and Redundant `removeFromCart`
**Issue:** `removeFromCart` merely decrements the item quantity (acting identically to `updateCartQuantity(itemId, -1)`) and leaves the item's key in the cart object with a `0` value.
**Solution:** Refactor `removeFromCart` so that it actually deletes the item from the cart object, rather than decrementing it.
**Code snippet:**
```typescript
removeFromCart: (itemId) =>
  set((state) => {
    const newCart = { ...state.cart };
    delete newCart[itemId];
    return { cart: newCart };
  }),
```

## 3. Excessive Boilerplate
**Issue:** `useStore.ts` contains 13 separate actions (like `setProduct`, `setShell`, `setButtons`, etc.) for updating individual properties inside the `config` state.
**Solution:** Replace all specific configuration setters with a single generic `updateConfig` function that accepts a key and its corresponding value. Ensure all components depending on the store are updated to use this new function.
**Code snippet (Interface):**
```typescript
interface AppStore {
  // Replace setProduct, setShell, etc. with:
  updateConfig: <K extends keyof ConfiguratorState>(key: K, value: ConfiguratorState[K]) => void;
}
```
**Code snippet (Implementation):**
```typescript
updateConfig: (key, value) =>
  set((state) => ({
    config: sanitizeConfig({ ...state.config, [key]: value }),
  })),
```

## 4. Unexpected Side Effects in `clearCart`
**Issue:** The `clearCart` function resets the user's active configuration (`config`) in addition to emptying the cart object.
**Solution:** Modify `clearCart` to only target the `cart` and `customBuilds` objects, removing the line that mutates the active `config`.
**Code snippet:**
```typescript
clearCart: () => set({ cart: {}, customBuilds: [] }),
```

## 5. Opaque Production Error Handling
**Issue:** The `loadInventory` method provides a fallback for local development but swallows errors silently in production, returning an empty/unpopulated inventory state.
**Solution:** Capture the error parameter in the catch block and log it explicitly. Then, ensure the error is re-thrown in production environments so that calling functions or UI components can gracefully handle it instead of experiencing silent failures.
**Code snippet:**
```typescript
loadInventory: async () => {
  try {
    const res = await fetch(`${API_BASE}/api/inventory`);
    if (!res.ok) throw new Error('Server not running');
    const data = await res.json();
    set({ inventory: data });
  } catch (error) {
    console.error('Failed to fetch inventory from server:', error);

    const currentInventory = get().inventory;
    if (Object.keys(currentInventory).length > 0) {
      return;
    }

    if (import.meta.env.DEV) {
      console.warn('Local development: using fallback inventory.');
      const fallback: Inventory = {};
      for (const item of allItems) {
        fallback[item.id] = 10;
      }
      set({ inventory: fallback });
    } else {
      // Re-throw in production so UI can catch and handle the error
      throw error;
    }
  }
}
```
