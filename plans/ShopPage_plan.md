# ShopPage.tsx Refactoring Plan

## 1. Architectural Issue: Complex Nested Logic in UI
**Problem:** `ShopPage.tsx` currently contains highly complex, deeply nested conditional logic within its `onSelect` callbacks for updating configuration state. This mixes UI concerns with business rules, specifically for resolving mutually exclusive modifications (e.g., selecting `kailhChoco` disables `detachableTriggerPaddle` and vice-versa).

**Solution:** Move this business logic out of the component and into the state management store (`useStore`). Create specific actions to handle these configuration updates and mutual exclusions.

**Implementation Steps:**
- Add specific actions to the `useStore` definition (e.g., `setNotchesMod`, `setTriggerMod`, `setDetachableTriggerMod`).
- In `store/useStore.ts`, implement these actions to handle the mutual exclusivity logic internally.
- Refactor `ShopPage.tsx` to call these new actions directly.

**Code Snippet:**
*In `useStore.ts` (conceptual action addition):*
```typescript
setTriggerMod: (id?: string) => set((state) => {
  if (!id) {
    return { config: { ...state.config, kailhChoco: false, triggerPlugs: false } };
  }
  return {
    config: {
      ...state.config,
      kailhChoco: id === 'kailhChoco',
      triggerPlugs: id === 'triggerPlugs',
      // Mutual exclusion logic handled inside the store
      ...(id === 'kailhChoco' ? { detachableTriggerPaddle: false } : {})
    }
  };
}),
```

*In `ShopPage.tsx`:*
```tsx
<ConfigSection
  title="Trigger Modifications"
  items={triggerModOptions}
  selectedId={selectedTriggerMod}
  isToggleable={true}
  onSelect={(id) => {
    // Calling the encapsulated logic
    store.setTriggerMod(selectedTriggerMod === id ? undefined : id);
  }}
  basePrice={0}
/>
```

## 2. TypeScript Issue: Type Assertions for Store Actions
**Problem:** The component makes use of type assertions (e.g., `id as 'deep' | 'subtle'` or `id as import('@shared/types').TriggerSide`) when passing selection IDs from `ConfigSection` to the state management store. This bypasses TypeScript's safety checks.

**Solution:** 
- Instead of using type assertions, improve the generic typing of the `ConfigSection` component so that its `onSelect` callback correctly infers the `id` type from the generic array passed to it. Alternatively, safely narrow the types before passing them to the store.

**Code Snippet:**
If `ConfigSection` is made generic over the `Item` type:
```tsx
// ConfigSection component definition is updated to generic <T extends string>
<ConfigSection<'deep' | 'subtle'>
  title="Notch Style"
  items={notchStyles} // Ensure items is strongly typed
  selectedId={config.notchStyle || 'deep'}
  // onSelect's `id` parameter is now automatically inferred as 'deep' | 'subtle'
  onSelect={(id) => store.setNotchStyle(id)} 
/>
```
Or, handle the validation within the `onSelect` callback:
```tsx
onSelect={(id) => {
  if (id === 'deep' || id === 'subtle') {
    store.setNotchStyle(id); // Safely narrowed
  }
}}
```

## 3. Performance / Maintainability: Missing Memoization for Derived State
**Problem:** Computed derived states (like `notchOptions`, `triggerModOptions`, etc.) are recalculated manually on every render, which creates new array references and leads to unnecessary re-renders of child components like `ConfigSection`.

**Solution:** Utilize the `useMemo` hook to cache these computed values and only recalculate them when their dependencies change.

**Code Snippet:**
```tsx
const notchOptions = useMemo(() => 
  mods.filter(m => m.id === 'notchesWavedash' || m.id === 'notchesFirefox'), 
[]);

const selectedNotch = useMemo(() => 
  config.notchesFirefox ? 'notchesFirefox' : config.notchesWavedash ? 'notchesWavedash' : undefined, 
[config.notchesFirefox, config.notchesWavedash]);

const triggerModOptions = useMemo(() => 
  addons
    .filter(a => a.id === 'triggerPlugs' || a.id === 'kailhChoco')
    .map(a =>
      a.id === 'kailhChoco'
        ? { ...a, label: 'kailh Choco Switch', price: (config.kailhChocoSide ?? 'both') === 'both' ? 40 : 30 }
        : a
    ),
[config.kailhChocoSide]);
```
