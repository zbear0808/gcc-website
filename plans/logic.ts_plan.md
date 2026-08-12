# Plan: Resolving `store logic.ts` Issues

## 1. Cart Zero-Quantity Bug
**Issue:** `updateCartQuantityLogic` sets `[itemId]: 0` when quantity reaches 0, leaving phantom keys in the cart object.
**Solution:** Check if `newVal === 0`. If so, use object destructuring to remove the `itemId` from the cart.
**Code Snippet:**
```typescript
export function updateCartQuantityLogic(
  currentCart: Cart,
  inventory: Inventory,
  itemId: string,
  delta: number
): Cart {
  const current = currentCart[itemId] ?? 0;
  const stock = inventory[itemId] ?? 0; // Fix for dangerous fallback

  const newVal = Math.min(stock, Math.max(0, current + delta));

  if (newVal === 0) {
    const { [itemId]: removedItem, ...rest } = currentCart;
    return rest;
  }

  return { ...currentCart, [itemId]: newVal };
}
```

## 2. Dangerous Inventory Fallback
**Issue:** `updateCartQuantityLogic` defaults to an arbitrary stock limit of `99` if an item is missing in the inventory state, risking overselling.
**Solution:** Change the fallback value to `0` instead of `99`. This prevents users from adding out-of-stock items when inventory data is missing.
**Code Snippet:**
```typescript
// Replace: const stock = inventory[itemId] ?? 99;
const stock = inventory[itemId] ?? 0; 
```

## 3. Type Safety Gap
**Issue:** In `toggleModLogic`, `modId` isn't properly constrained to boolean modifier keys of `ConfiguratorState`. 
**Solution:** Create a helper type to extract only the keys of `ConfiguratorState` that correspond to boolean values, and type `modId` using this helper type.
**Code Snippet:**
```typescript
// Helper type to extract boolean keys
type BooleanModKeys<T> = { [K in keyof T]: T[K] extends boolean | undefined ? K : never }[keyof T];

export function toggleModLogic(
  currentConfig: ConfiguratorState, 
  modId: BooleanModKeys<ConfiguratorState>
): ConfiguratorState {
  // ...
}
```

## 4. Unnecessary Object Allocation (Anti-pattern)
**Issue:** `toggleModLogic` repeatedly uses object spread operations inside conditional statements, which creates multiple unnecessary intermediate objects.
**Solution:** Mutate a local `updates` object with the target changes and do a single spread operation at the end before returning.
**Code Snippet:**
```typescript
export function toggleModLogic(
  currentConfig: ConfiguratorState, 
  modId: keyof ConfiguratorState // or BooleanModKeys<ConfiguratorState>
): ConfiguratorState {
  const current = currentConfig[modId] as boolean | undefined;
  const newVal = !current;
  
  const updates: Partial<ConfiguratorState> = { [modId]: newVal as any };

  // Firefox and wavedash notches are mutually exclusive
  if (modId === 'notchesFirefox' && newVal) {
    updates.notchesWavedash = false;
  }
  if (modId === 'notchesWavedash' && newVal) {
    updates.notchesFirefox = false;
  }

  // Trigger Plugs and kailh Choco are mutually exclusive
  if (modId === 'triggerPlugs' && newVal) {
    updates.kailhChoco = false;
  }
  if (modId === 'kailhChoco' && newVal) {
    updates.triggerPlugs = false;
    updates.detachableTriggerPaddle = false;
  }
  if (modId === 'detachableTriggerPaddle' && newVal) {
    updates.kailhChoco = false;
  }

  return sanitizeConfig({ ...currentConfig, ...updates } as ConfiguratorState);
}
```
