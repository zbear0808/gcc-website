# Plan to Resolve shared/types.ts Issues

This document outlines the step-by-step resolution plan for refactoring `shared/types.ts` to address **Anti-Pattern (Empty Interfaces / Identity Aliases)**, **Weak Typing (generic string)**, and **Type Hierarchy Disconnect**.

---

## 1. Anti-Pattern (Empty Interfaces / Identity Aliases)

### Issues Identified
1. **Identity Type Aliases / Empty Interface Extensions (Lines 46–58, Line 68):**
   `CableOption`, `RumbleOption`, `SliderPotOption`, `ZButtonOption`, `MembraneOption`, `StickCapOption`, `TriggerPaddlePcbOption`, and `PartItem` are defined as direct identity aliases to `CatalogItem` (e.g., `export type CableOption = CatalogItem;`).
   - They provide zero type discrimination or compile-time/runtime differentiation over `CatalogItem`.
   - A `CableOption` can be assigned to a variable expecting a `RumbleOption` without any type check error.
   - If converted to empty interfaces (`export interface CableOption extends CatalogItem {}`), they present the empty interface anti-pattern.

### Proposed Code Changes

#### A. Introduce Category Discriminants or Subtype Discriminators
Define explicit category discriminants on item subtypes so TypeScript can distinguish between options:

```typescript
export type CategoryId =
  | 'products'
  | 'shells'
  | 'buttons'
  | 'cables'
  | 'rumble'
  | 'sliderPots'
  | 'zButtons'
  | 'membranes'
  | 'stickCaps'
  | 'triggerPlugs'
  | 'triggerPaddlePcbs'
  | 'mods'
  | 'addons'
  | 'parts';

export interface BaseCatalogItem {
  id: string;
  label: string;
  description?: string;
  price?: number;
  individualPrice?: number;
  image?: string;
  weight?: number;
  requiresInventory?: boolean;
  category?: CategoryId;
}

export interface CableOption extends BaseCatalogItem {
  category?: 'cables';
}

export interface RumbleOption extends BaseCatalogItem {
  category?: 'rumble';
}

export interface SliderPotOption extends BaseCatalogItem {
  category?: 'sliderPots';
}

export interface ZButtonOption extends BaseCatalogItem {
  category?: 'zButtons';
}

export interface MembraneOption extends BaseCatalogItem {
  category?: 'membranes';
}

export interface StickCapOption extends BaseCatalogItem {
  category?: 'stickCaps';
}

export interface TriggerPaddlePcbOption extends BaseCatalogItem {
  category?: 'triggerPaddlePcbs';
}

export interface PartItem extends BaseCatalogItem {
  category?: 'parts';
}
```

---

## 2. Weak Typing (generic string)

### Issues Identified
1. **ConfiguratorState Generic String Fields (Lines 82–91):**
   Fields `product`, `shell`, `buttons`, `cable`, `rumble`, `sliderPots`, `zButton`, `membrane`, `stickCap` are typed as generic `string | undefined`. This allows any arbitrary string to be passed without validation against valid item IDs.
2. **Generic String Record Keys in `Cart`, `Inventory`, `InventoryResponse` (Lines 107–108, Lines 146–148):**
   `Cart` and `Inventory` are typed as `Record<string, number>`, allowing non-catalog item keys.
3. **Generic Category ID in `CatalogCategory` (Line 73):**
   `CatalogCategory.id` is typed as generic `string` instead of the constrained `CategoryId` literal union.

### Proposed Code Changes

#### A. Define Strong ID Union Types & Item Identifiers
```typescript
export type ItemId = string; // Alias or branded type for catalog item IDs

export type ProductId = 'diy-kit' | 'full-build' | string;

export interface ConfiguratorState {
  product?: ProductId;
  shell?: string;
  buttons?: string;
  cable?: string;
  rumble?: string;
  sliderPots?: string;
  zButton?: string;
  membrane?: string;
  stickCap?: string;
  notchesFirefox?: boolean;
  notchesWavedash?: boolean;
  detachableTriggerPaddle?: boolean;
  notchStyle?: 'deep' | 'subtle';
  triggerPlugs?: boolean;
  kailhChoco?: boolean;
  kailhChocoSide?: TriggerSide;
  springCut?: boolean;
  wornShell?: boolean;
  triggerPlugSide?: TriggerSide;
  triggerPlugLength?: TriggerPlugLength;
}

export type Cart = Record<ItemId, number>;
export type Inventory = Record<ItemId, number>;

export interface InventoryResponse {
  [itemId: ItemId]: number;
}
```

---

## 3. Type Hierarchy Disconnect

### Issues Identified
1. **`CatalogCategory` Subtypes Disconnect (Lines 72–78):**
   `CatalogCategory.subtypes` is hardcoded as `CatalogItem[]`. In consumer components like `ProductPage.tsx`, developers must manually cast `category.subtypes as ShellOption[]` or `category.subtypes as ButtonOption[]`.
2. **`CatalogItem` Price Hierarchy Disconnect (Lines 10–19):**
   `CatalogItem` defines `price?: number` and `individualPrice?: number` as optional. However:
   - `Product` always requires a base `price: number`.
   - `IndividualCatalogItem` requires `individualPrice: number`.
   Downstream code is forced to use non-null assertions (`!`) or type casts (`as number`).
3. **`ConfigSectionGroup` Filter Disconnect (Lines 152–155):**
   `filterFn: (item: CatalogItem) => boolean` is disconnected from individual item category subtypes.

### Proposed Code Changes

#### A. Make `CatalogCategory` Generic
```typescript
export interface CatalogCategory<T extends CatalogItem = CatalogItem> {
  id: CategoryId;
  label: string;
  description: string;
  image: string;
  subtypes: T[];
}
```

#### B. Establish Clear Price & Item Hierarchy
```typescript
export interface Product extends CatalogItem {
  description: string;
  image: string;
  price: number; // Required for products
}

export interface IndividualCatalogItem extends CatalogItem {
  individualPrice: number; // Required for standalone catalog items
}
```

---

## Verification Plan

1. **Static Analysis & Type Checks:**
   Run `npx tsc --noEmit` to verify type safety across `shared/catalog.ts`, `shared/pricing.ts`, `src/pages/ProductPage.tsx`, `src/pages/ShopPage.tsx`, and `src/store/useStore.ts`.
2. **Unit & Integration Tests:**
   Run `npm test` or `npx vitest` to confirm all store logic, pricing calculations, and order logic tests pass without regressions.
