# CartPage.tsx Refactoring Plan

This document outlines the planned fixes for the bugs and anti-patterns identified in `src/pages/CartPage.tsx`.

## 1. TypeScript / Store Logic Bug

**Issue**: 
The `cartTotal` function inside `CartPage.tsx` currently uses a defensive runtime check (`if (typeof store.cartTotal === 'function')`) with a manual fallback calculation. The issue described this as bypassing the compiler using `@ts-ignore` (although the `@ts-ignore` directive may have been recently removed or implied by the workaround). This defensive logic is unnecessary and undermines TypeScript's type safety and Zustand's state model.

**Reasoning**: 
Zustand's `persist` middleware properly retains store action methods. Because `cartTotal` is defined in the initial store creation (and omitted from `partialize` serialization), it will always exist as a function on the store object. We can safely remove the defensive fallback and trust the compiler, which correctly types `store.cartTotal` as a function.

**Proposed Changes (`src/pages/CartPage.tsx`)**:
```diff
-  const cartTotal = () => {
-    let partsTotal = 0;
-    if (typeof store.cartTotal === 'function') {
-      partsTotal = store.cartTotal();
-    } else {
-      partsTotal = cartItems.reduce((acc, item) => acc + (item.displayPrice || 0) * item.qty, 0);
-    }
-
-    const buildsTotal = store.customBuilds?.reduce((sum, build) => sum + calculateTotal(build), 0) ?? 0;
-    return partsTotal + buildsTotal;
-  };
+  const cartTotal = () => {
+    const partsTotal = store.cartTotal();
+    const buildsTotal = store.customBuilds?.reduce((sum, build) => sum + calculateTotal(build), 0) ?? 0;
+    return partsTotal + buildsTotal;
+  };
```

## 2. React Anti-Pattern (Array Index as Key)

**Issue**: 
The custom builds mapped in the JSX use the array index (`idx`) as the React `key` (`key={\`build-${idx}\`}`). Because items can be deleted from the middle of the cart, React can lose track of component state and identity, causing incorrect UI rendering and state mismatch.

**Reasoning**: 
React requires stable, unique identifiers for keys when mapping dynamic lists. We should generate a unique UUID when adding a custom build to the store, and use that UUID as the React key.

**Proposed Changes**:
1. **Update `src/shared/types.ts`** to add an `id` to the state:
```diff
 export interface ConfiguratorState {
+  id?: string;
   product?: string;
```

2. **Update `src/store/useStore.ts`** to generate an ID when adding a build:
```diff
-      addCustomBuild: (config) =>
-        set((state) => ({ customBuilds: [...state.customBuilds, config] })),
+      addCustomBuild: (config) =>
+        set((state) => ({ customBuilds: [...state.customBuilds, { ...config, id: crypto.randomUUID() }] })),
```

3. **Update `src/pages/CartPage.tsx`** to use the unique ID:
```diff
-        {store.customBuilds?.map((build, idx) => {
+        {store.customBuilds?.map((build, idx) => {
           const product = getItem(build.product ?? '');
           const buildPrice = calculateTotal(build);
           return (
-            <div key={`build-${idx}`} className="cart-item">
+            <div key={build.id ?? `build-${idx}`} className="cart-item">
```
*(Optional but recommended: update `removeCustomBuild` in the store to accept and filter by `id` instead of the array index).*

## 3. Architectural Issue (Hardcoded Conditional Rendering)

**Issue**: 
The `renderBuildOptions` helper function relies on a massive block of hardcoded `if` statements checking each property of the `ConfiguratorState`. This tightly couples the UI to specific configuration keys and violates the Open/Closed Principle. Adding new customization options requires modifying this UI component every time.

**Reasoning**: 
We can refactor `renderBuildOptions` to use a data-driven approach by defining a mapping dictionary of configuration keys to their display formatting functions. This makes the code robust, easily extensible, and highly maintainable.

**Proposed Changes (`src/pages/CartPage.tsx`)**:
```tsx
const buildOptionFormatters: Partial<Record<keyof ConfiguratorState, (build: ConfiguratorState, val: any) => string | null>> = {
  shell: (_, val) => `Shell: ${getItem(val)?.label || val}`,
  buttons: (_, val) => `Buttons: ${getItem(val)?.label || val}`,
  cable: (_, val) => `Cable: ${getItem(val)?.label || val}`,
  rumble: (_, val) => `Rumble: ${getItem(val)?.label || val}`,
  sliderPots: (_, val) => `Slider Pots: ${getItem(val)?.label || val}`,
  zButton: (_, val) => `Z Button: ${getItem(val)?.label || val}`,
  membrane: (_, val) => `Membranes: ${getItem(val)?.label || val}`,
  stickCap: (_, val) => `Stick Cap: ${getItem(val)?.label || val}`,
  notchesFirefox: (build, val) => val ? `Notches: Firefox (${build.notchStyle || 'standard'})` : null,
  notchesWavedash: (build, val) => val ? `Notches: Wavedash (${build.notchStyle || 'standard'})` : null,
  triggerPlugs: (build, val) => {
    if (!val) return null;
    const side = build.triggerPlugSide === 'l' ? 'Left' : build.triggerPlugSide === 'r' ? 'Right' : 'Both';
    const length = build.triggerPlugLength || 'short';
    return `Trigger Plugs: ${side} (${length})`;
  },
  kailhChoco: (build, val) => {
    if (!val) return null;
    const side = build.kailhChocoSide === 'l' ? 'Left' : build.kailhChocoSide === 'r' ? 'Right' : 'Both';
    return `kailh Choco Triggers: ${side}`;
  },
  springCut: (_, val) => val ? `Spring Cut` : null,
  detachableTriggerPaddle: (_, val) => val ? `Detachable Trigger Paddle Mod` : null,
  wornShell: (_, val) => val ? `Worn Shell` : null,
};

const renderBuildOptions = (build: ConfiguratorState) => {
  return Object.entries(build)
    .map(([key, value]) => {
      const formatter = buildOptionFormatters[key as keyof ConfiguratorState];
      return formatter ? formatter(build, value) : null;
    })
    .filter(Boolean) as string[];
};
```
