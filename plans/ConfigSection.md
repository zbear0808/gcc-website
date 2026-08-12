# ConfigSection Issue Resolution Plan

This plan details the steps to address type safety, code duplication, state control, and class formatting issues in `src/components/ConfigSection.tsx`.

## 1. Type Safety Bypasses

**Problem:** 
1. In `ConfigSection.tsx` (lines 64 and 159), `config[category]` is forcibly cast with unsafe type assertions like `(Array.isArray(val) ? val : []) as string[]` or `as unknown as string[]`.
2. Property access for `individualPrice` relies on unsafe type assertions or unsafe fallbacks like `(item as any).individualPrice` instead of leveraging the strongly typed `CatalogItem` interface.

**Solution:**
1. Implement a type-safe helper function `getCategoryArrayValue` or narrow `config[category]` values using native TypeScript type guards (`typeof` and `Array.isArray`) without `as unknown` or `as string[]` casts.
2. Rely directly on the `CatalogItem` interface's optional `individualPrice?: number` property.

**Code Snippet / Example:**
```typescript
// Type-safe helper to extract multi-select values from ConfiguratorState
const getCategoryArrayValue = (
  config?: ConfiguratorState,
  category?: keyof ConfiguratorState
): string[] => {
  if (!config || !category) return [];
  const val = config[category];
  if (Array.isArray(val)) {
    return val.filter((item): item is string => typeof item === 'string');
  }
  return [];
};

// Safe price resolution using CatalogItem
const getItemPrice = (item: CatalogItem, priceKey: 'price' | 'individualPrice'): number => {
  const p = priceKey === 'individualPrice' ? (item.individualPrice ?? item.price) : item.price;
  return typeof p === 'number' ? p : 0;
};
```

---

## 2. DRY Violations (Duplicated Active Item Logic)

**Problem:** 
The logic to determine whether an item is active (checking `selectedId`, `isMulti` with array inclusions, or `config[category] === item.id`) is duplicated line-for-line in two places:
1. Inside `renderItem` (lines 59–68)
2. Inside the `descriptionPosition === 'outside'` section (lines 154–163)

**Solution:** 
Extract the active check into a single, reusable pure helper function `checkIsActive(itemId: string, props: ConfigSectionProps)`.

**Code Snippet / Example:**
```typescript
interface IsActiveParams {
  itemId: string;
  selectedId?: string;
  isMulti?: boolean;
  category?: keyof ConfiguratorState;
  config?: ConfiguratorState;
}

const checkIsActive = ({
  itemId,
  selectedId,
  isMulti,
  category,
  config,
}: IsActiveParams): boolean => {
  if (selectedId !== undefined) {
    return selectedId === itemId;
  }
  if (!category || !config) {
    return false;
  }
  const val = config[category];
  if (isMulti) {
    return Array.isArray(val) && val.includes(itemId);
  }
  return val === itemId;
};
```

---

## 3. Ambiguous Control State

**Problem:** 
`ConfigSection` can be controlled either by an explicit `selectedId` prop or by passing `category` and `config`. When both (or partial combinations) are provided, the resolution logic relies on implicit `if/else if` ordering. This creates ambiguity around which source of truth wins and how unhandled states behave.

**Solution:** 
Define a clear, documented control mode resolution hierarchy in the unified active-check utility:
1. **Explicit `selectedId` (Highest Precedence):** Used when `selectedId !== undefined`.
2. **Config-Driven (`category` + `config`):**
   - Multi-select mode (`isMulti = true`): Evaluates array inclusions on `config[category]`.
   - Single-select mode (`isMulti = false`): Evaluates scalar equality (`config[category] === itemId`).
3. **Fallback:** Defaults to `false` when neither control mode is satisfied.

**Code Snippet / Example:**
```typescript
/**
 * Resolves the active state of an item based on props hierarchy:
 * 1. Controlled via selectedId (if provided)
 * 2. Controlled via config[category] (multi-select array or single scalar)
 */
const isItemActive = (item: CatalogItem, props: ConfigSectionProps): boolean => {
  const { selectedId, isMulti, category, config } = props;

  if (selectedId !== undefined) {
    return selectedId === item.id;
  }

  if (category && config) {
    const value = config[category];
    if (isMulti) {
      return Array.isArray(value) ? value.includes(item.id) : false;
    }
    return value === item.id;
  }

  return false;
};
```

---

## 4. Messy Classname Concatenation

**Problem:** 
Class names are concatenated using multi-line template literals filled with nested ternary operations (e.g. `config-item-btn ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''} ${variant === 'sub' ? 'sub-btn' : ''}...`), leading to awkward spacing, extra trailing spaces, and poor code legibility.

**Solution:** 
Create or import a utility function `cn` (or `classNames`) that filters out falsy values and joins valid classes with a single space.

**Code Snippet / Example:**
```typescript
// Classname utility helper
const cn = (...classes: (string | boolean | undefined | null)[]): string =>
  classes.filter(Boolean).join(' ');

// Usage in renderItem button:
const buttonClassName = cn(
  'config-item-btn',
  isActive && 'active',
  disabled && 'disabled',
  variant === 'sub' && 'sub-btn',
  buttonSize === 'small' && 'small-btn',
  isToggleable && 'toggleable-btn'
);

// Usage in section wrapper:
const sectionClassName = cn('config-section', variant === 'sub' && 'sub-variant');

// Usage in price text:
const priceClassName = cn(
  'item-price',
  diff > 0 && 'price-increase',
  diff < 0 && 'price-decrease',
  basePrice === undefined && itemPrice > 0 && 'price-increase'
);
```

---

## Summary of Implementation Steps

1. Add `cn` helper in `ConfigSection.tsx` or import from common utilities.
2. Implement `isItemActive` helper to eliminate code duplication between `renderItem` and the outside description renderer, while resolving type casting and control state ambiguity.
3. Implement `getItemPrice` helper for type-safe price computation using `CatalogItem`.
4. Refactor JSX in `ConfigSection.tsx` to use the new helpers and clean classname arrays.
