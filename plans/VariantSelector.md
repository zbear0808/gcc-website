# Resolution Plan: VariantSelector.tsx

## Issues to Resolve
- **Derived State Anti-pattern**: Remove the `useEffect` that syncs `value` prop into local state, and compute derived data directly during render.
- **Type Safety Bypasses**: Remove `(item as any).individualPrice` casts and properly type the `item` parameter.
- **DRY Violations & Heavy Computations**: Extract heavy, nested array manipulations into reusable, memoized helper functions to avoid unnecessary recalculations on each render.
- **Inline Styles**: Replace heavy reliance on inline CSS objects with external stylesheet classes or utility classes.
