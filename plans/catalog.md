# Plan to Resolve shared/catalog.ts Issues

This document outlines the step-by-step resolution plan for refactoring `shared/catalog.ts` to address **Zombie Code** and **Type Casting Smell**.

---

## 1. Zombie Code

### Issues Identified
1. **Commented-out Product Definition (Lines 31–39):**
   The product entry for `'0-solder-diy-kit'` is commented out directly inside the `products` array. Commented-out code causes clutter, reduces readability, and becomes obsolete over time.
2. **Redundant Alias Export `otherParts` (Line 219 & Line 299):**
   `export const otherParts = parts;` is a redundant alias assigned to `parts` and is only referenced internally in `fullCatalog`. It creates unnecessary public API surface area and dead code alias overhead.

### Proposed Code Changes

#### A. Remove Commented-out Code
Delete lines 31–39 in `shared/catalog.ts`:
```typescript
-  // {
-  //   id: '0-solder-diy-kit',
-  //   label: '0-Solder DIY Kit',
-  //   description:
-  //     'Board with slider pots, T3 stickboxes, DH1212 magnets + mounts, Z button, GCC cable, notch ruler, trigger plugs, cell motor, 6 pin ribbon cable, and trigger paddle PCBs. All components are pre-soldered, you just need to mount the stickboxes and magnets and calibrate.',
-  //   price: 79,
-  //   image: '/images/products/diy-kit-no-solder.png',
-  //   weight: 10,
-  // },
```

#### B. Remove Redundant `otherParts` Export & Reference Directly
Remove `export const otherParts = parts;` and reference `parts` directly in `fullCatalog`:
```typescript
-/** All parts */
-export const otherParts = parts;

...

 export const fullCatalog: CatalogCategory[] = [
   ...catalog,
-  ...otherParts.map((part) => ({
+  ...parts.map((part) => ({
     id: part.id,
     label: part.label,
     description: part.description ?? '',
     image: part.image ?? '',
     subtypes: [part],
   })),
 ];
```

---

## 2. Type Casting Smell

### Issues Identified
1. **Un-narrowed Filter Predicate for `individualItems` (Lines 203–216):**
   The filter `.filter((item) => 'individualPrice' in item && item.individualPrice != null)` narrows `individualItems` at runtime, but TypeScript still infers the array type as `CatalogItem[]` instead of `IndividualCatalogItem[]` (or `(CatalogItem & { individualPrice: number })[]`). Consumers must perform type assertions (`as ...`) or non-null assertions (`!`) when referencing `individualPrice`.
2. **Missing Custom Type Guards:**
   There are no explicit, reusable type guard predicate functions (e.g. `hasIndividualPrice(item)`) exported from `shared/catalog.ts`. This forces downstream modules (`pricing.ts`, `useStore.ts`, `PartsPage.tsx`, `CartPage.tsx`) to resort to `as unknown as CatalogItem` or unsafe type assertions.

### Proposed Code Changes

#### A. Define Type Guard `hasIndividualPrice` and `IndividualCatalogItem`
In `shared/types.ts` (or `shared/catalog.ts`), define the type and type guard:
```typescript
export interface IndividualCatalogItem extends CatalogItem {
  individualPrice: number;
}

export function hasIndividualPrice(item: CatalogItem): item is IndividualCatalogItem {
  return typeof item.individualPrice === 'number';
}
```

#### B. Refactor `individualItems` Filtering in `shared/catalog.ts`
Use the custom type guard so TypeScript automatically narrows `individualItems` to `IndividualCatalogItem[]`:
```typescript
-export const individualItems: CatalogItem[] = [
+export const individualItems: IndividualCatalogItem[] = [
   ...addons,
   ...shells,
   ...buttons,
   ...parts,
   ...triggerPlugs,
   ...triggerPaddlePcbs,
   ...rumbles,
   ...cables,
   ...sliderPots,
   ...zButtons,
   ...membranes,
   ...stickCaps,
-].filter((item) => 'individualPrice' in item && item.individualPrice != null);
+].filter(hasIndividualPrice);
```

---

## Verification Plan

1. **Static Analysis & Type Check:**
   Run `npx tsc --noEmit` or `npm run build` to ensure all TypeScript types compile without errors.
2. **Unit Tests:**
   Run test suites (`npm test` or `npx vitest`) to verify catalog item filtering and pricing calculations remain accurate.
