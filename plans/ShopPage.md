# Resolution Plan: ShopPage.tsx

## Overview
This document outlines the technical debt resolution plan for [`src/pages/ShopPage.tsx`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/src/pages/ShopPage.tsx). The goal is to improve maintainability, type safety, and runtime performance by resolving architectural, TypeScript, and performance flaws.

---

## 1. Architectural Issue: Complex, Deeply Nested Conditional Logic

### Description
`ShopPage.tsx` contains inline state mutations and complex conditional logic inside UI event handlers (e.g., `onSelect` callbacks for notches, trigger modifications, spring modifications, and detachable trigger paddles).
- **Mutually Exclusive Selections**: Inline logic handles complex inter-dependent state rules (e.g., selecting `kailhChoco` clears `detachableTriggerPaddle`, setting notch states clears `notchStyle`).
- **Deeply Nested UI Branches**: Multiple layers of nested JSX conditionals (`isFullBuild && (...)`, `{config.triggerPlugs && (...)}`, `{(config.notchesFirefox || config.notchesWavedash) && (...)}`) pollute the render method.

### Solution
1. **Encapsulate Domain Rules in Store**: Move inter-dependent option toggle logic (like mutually exclusive trigger mods or notch toggles) into helper methods or dedicated store actions in `useStore`.
2. **Decompose JSX Layout**: Break down conditional sub-sections (e.g., `FullBuildOptions`, `TriggerModOptions`) into cleanly separated local components or structured sections to eliminate deep nesting in the main render tree.

---

## 2. TypeScript Issue: Type Assertions (`as` Casting)

### Description
The component uses explicit type assertions when invoking store setters inside `ConfigSection` callbacks:
- Line 227: `store.setNotchStyle(id as 'deep' | 'subtle')`
- Line 265: `store.setTriggerSide(id as import('@shared/types').TriggerSide)`
- Line 273: `store.setTriggerLength(id as import('@shared/types').TriggerPlugLength)`
- Line 285: `store.setkailhChocoSide(id as import('@shared/types').TriggerSide)`

### Solution
1. **Type Guard Functions**: Implement small type-guard helper functions (e.g., `isTriggerSide(id)`, `isNotchStyle(id)`) or string literal type validators.
2. **Generics for ConfigSection**: Update or utilize generic parameters on `ConfigSection` handlers so `id` is typed according to the item array rather than fallback `string`.

---

## 3. Performance Issue: Derived States & Handlers Recalculated Without Memoization

### Description
Derived states and dynamic collections are re-computed from scratch on every single component render pass:
- `notchOptions`, `selectedNotch` (Lines 23-24)
- `triggerModOptions`, `selectedTriggerMod` (Lines 26-33)
- `springOptions`, `selectedSpring`, `detachableTriggerOptions`, `selectedDetachableTrigger` (Lines 35-39)
- `isFullBuild`, `isDIY`, `selectedShell` (Lines 50-53)
- Inline `onSelect` inline functions inside `ConfigSection` components causing re-renders of child components.

### Solution
1. **Memoize Derived Collections**: Wrap derived option calculations in `useMemo` hooks dependent strictly on relevant store slice variables (e.g., `config.kailhChocoSide`, `config.notchesFirefox`).
2. **Memoize Event Handlers**: Wrap event handlers like `handleAddToCart` and section selection callbacks in `useCallback`.

---

## Step-by-Step Implementation Roadmap

1. **Step 1: Memoize Derived Variables & Options**
   Wrap `notchOptions`, `triggerModOptions`, `springOptions`, `detachableTriggerOptions`, `selectedShell`, and derived flag checks in `useMemo`.

2. **Step 2: Refactor State Mutation Callbacks**
   Extract inline state setting logic into typed handler functions or `useStore` custom methods.

3. **Step 3: Remove Type Assertions**
   Replace `id as 'deep' | 'subtle'` and `id as TriggerSide` with type guards or typed handler signatures.

4. **Step 4: Restructure & Simplify JSX Tree**
   Extract full-build configuration sub-sections into dedicated layout helper components.

---

## Verification & Testing Plan

1. **Type Checker Validation**: Run `npx tsc --noEmit` to verify zero type errors or assertion regressions.
2. **Functional UI Testing**: Verify that clicking options (Shells, Buttons, Cable, Notches, Trigger Mods) correctly updates configuration without breaking mutual exclusivity rules.
3. **Build Check**: Run `npm run build` to ensure clean production compilation.
