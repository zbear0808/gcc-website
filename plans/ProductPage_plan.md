# ProductPage.tsx Refactoring Plan

This document outlines the step-by-step plan for resolving both the TypeScript and architectural issues found in `ProductPage.tsx`.

## 1. Architectural Issue

**Issue:** 
The logic determining which UI selector component to render relies on hardcoded checks against specific category IDs (`category.id === 'shells'`, etc.). This violates the open-closed principle, meaning that any new variant categories would require changes to `ProductPage.tsx`.

**Solution:**
We will update the `CatalogCategory` type and the actual categories within the catalog to explicitly specify their presentation logic (whether they should be rendered via the `VariantSelector` or `ConfigSection` component) and which `facets` they should use.

### Step 1a: Move and Define `Facet<T>` in `shared/types.ts`
To avoid circular dependencies and make the type universally available, we will extract the `Facet<T>` interface from `VariantSelector.tsx` into `shared/types.ts`.

```typescript
// In shared/types.ts
export interface Facet<T> {
  key: string;
  label: string;
  getValue: (item: T) => string | null;
}
```

### Step 1b: Extend `CatalogCategory`
Next, extend the `CatalogCategory` interface in `shared/types.ts` to include optional configuration properties for the UI components.

```typescript
// In shared/types.ts
export interface CatalogCategory {
  id: string;
  label: string;
  description: string;
  image: string;
  subtypes: CatalogItem[];
  presentationType?: 'variant' | 'config';
  facets?: Facet<any>[];
}
```

### Step 1c: Update the Catalog configuration
In `shared/catalog.ts`, assign the `presentationType` and the corresponding `facets` from `shared/facets.ts` directly to the appropriate categories.

```typescript
// In shared/catalog.ts
import { shellFacets, buttonFacets, stickCapFacets } from './facets';

export const catalog: CatalogCategory[] = [
  {
    id: 'shells',
    label: 'Controller Shells',
    description: 'Original and third-party controller shells...',
    image: '/images/parts/shells.png',
    subtypes: shells,
    presentationType: 'variant',
    facets: shellFacets as Facet<any>[],
  },
  // Apply similar updates to 'buttons' and 'stick-caps'
  // ...
]
```

## 2. TypeScript Issue

**Issue:** 
`ProductPage.tsx` bypasses the compiler using assertions (e.g., `as import('@shared/types').ShellOption[]`) to force-fit `category.subtypes` into `VariantSelector`. Additionally, any potential `@ts-ignore` assertions regarding the `image` property are unstable and should be properly typed out.

**Solution:**
By implementing the architectural fix above, we can simplify `ProductPage.tsx` and eliminate these assertions.

### Step 2a: Refactor `ProductPage.tsx`
With the properties now driven by data, we can remove the hardcoded conditions and array type assertions completely. `VariantSelector` correctly accepts items of type `T extends CatalogItem`, and since `category.subtypes` is safely typed as `CatalogItem[]`, we no longer need to bypass the compiler.

```tsx
// In ProductPage.tsx (replacing the hardcoded conditional logic)
{category.subtypes.length > 1 && (
  category.presentationType === 'variant' ? (
    <VariantSelector
      title="Options"
      items={category.subtypes}
      facets={category.facets || []}
      value={selectedItem}
      onChange={setSelectedItem}
      basePrice={item.individualPrice ?? item.price ?? 0}
      priceKey="individualPrice"
      getStock={(id) => store.inventory[id] || 0}
    />
  ) : (
    <ConfigSection
      title="Options"
      items={category.subtypes}
      selectedId={selectedItem}
      onSelect={setSelectedItem}
      basePrice={item.individualPrice ?? item.price ?? 0}
      priceKey="individualPrice"
      getStock={(id) => store.inventory[id] || 0}
      descriptionPosition="none"
    />
  )
)}
```

### Step 2b: Ensure safe Image Type resolution
To address any image property resolutions without utilizing `@ts-ignore`, we continue utilizing safe optional chaining logic natively supported by the typings. Because `CatalogItem` defines `image?: string` and `CatalogCategory` defines a mandatory `image: string`, doing `item.image || category.image` perfectly validates against `string` without raising typescript errors. We will remove any trailing `@ts-ignore` directives left locally.

```tsx
// In ProductPage.tsx
{/* The fallback naturally resolves to string, satisfying the JSX element constraint */}
<img src={item.image || category.image} alt={item.label} />
```

## Summary of Changes
1. Extract `Facet` interface to `@shared/types.ts`.
2. Introduce `presentationType` and `facets` variables onto the `CatalogCategory` base type.
3. Migrate hardcoded UI presentation logic into `shared/catalog.ts` via declarative properties.
4. Clean up `ProductPage.tsx` by consuming those declarative properties, thus eliminating the rigid ID-based switches and the need for array type coercion (`as ShellOption[]`). 
5. Remove any local `@ts-ignore` tags corresponding to image handling by properly leveraging the inherent fallback typing (`item.image || category.image`).
