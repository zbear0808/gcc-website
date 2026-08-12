# PartsPage.tsx Action Plan

## 1. TypeScript Bug: Remove `cartTotal` fallback logic
**Issue:** The local `cartTotal` function in `PartsPage.tsx` includes a runtime check for `typeof store.cartTotal === 'function'` and implements a redundant fallback calculation traversing `store.cart`. This mimics a type-bypass or fallback approach, which is unnecessary since `store.cartTotal` is safely typed and implemented in `useStore.ts`.

**Solution:** Remove the entire local `cartTotal` function and use `store.cartTotal()` directly in the JSX.

**Code Snippet:**
```tsx
// Remove this entire block from PartsPage.tsx:
-  const cartTotal = () => {
-    let partsTotal = 0;
-    if (typeof store.cartTotal === 'function') {
-      return store.cartTotal();
-    }
-    let total = 0;
-    Object.entries(store.cart).forEach(([id, qty]) => {
-      const category = fullCatalog.find(c => c.subtypes.some(i => i.id === id));
-      const item = category?.subtypes.find(i => i.id === id);
-      if (item) {
-        total += (item.price || 0) * qty;
-      }
-    });
-    return total;
-  };

// Update the JSX to call store.cartTotal() directly:
       <div className="cart-summary">
-        <span>Total: ${formatPrice(cartTotal())}</span>
+        <span>Total: ${formatPrice(store.cartTotal())}</span>
         <button onClick={() => navigate('/cart')}>View Cart</button>
       </div>
```

## 2. Architectural Issue: Move Category Metadata to Shared Catalog
**Issue:** `PartsPage.tsx` hardcodes arrays of string IDs (`electronicsIds`, `shellsAndButtonsIds`, etc.) to group catalog items. This metadata belongs in the shared catalog definition.

**Solution:**
1. Update `CatalogCategory` and `CatalogItem` in `shared/types.ts` to include an optional `categoryGroup` property.
2. Update the categories and parts in `shared/catalog.ts` to assign the appropriate `categoryGroup` string (e.g., `'Electronic Parts'`, `'Cosmetic Parts'`, etc.).
3. Update `fullCatalog` mapping in `shared/catalog.ts` to copy `categoryGroup` from `otherParts`.
4. Refactor `PartsPage.tsx` to group items dynamically using the `categoryGroup` property instead of hardcoded arrays.

**Code Snippet:**

`shared/types.ts`
```ts
export interface CatalogItem {
  id: string;
  // ...
  categoryGroup?: string;
}

export interface CatalogCategory {
  id: string;
  // ...
  categoryGroup?: string;
}
```

`shared/catalog.ts`
```ts
// Example update to individual parts:
export const parts: PartItem[] = [
  {
    id: 'board-only',
    label: 'PhobGCC Board Only',
    // ...
    categoryGroup: 'Electronic Parts'
  },
  // ...
];

// Update fullCatalog to map categoryGroup:
export const fullCatalog: CatalogCategory[] = [
  ...catalog,
  ...otherParts.map((part) => ({
    id: part.id,
    label: part.label,
    description: part.description ?? '',
    image: part.image ?? '',
    subtypes: [part],
    categoryGroup: part.categoryGroup,
  })),
];
```

`PartsPage.tsx`
```tsx
// Remove hardcoded arrays (electronicsIds, shellsAndButtonsIds, mechanicalTriggerIds, stickboxIds)
// Group directly using the new property:
const electronics = fullCatalog.filter(c => c.categoryGroup === 'Electronic Parts');
const shellsAndButtons = fullCatalog.filter(c => c.categoryGroup === 'Cosmetic Parts');
const mechanicalTriggers = fullCatalog.filter(c => c.categoryGroup === 'Mechanical Trigger Mod');
const stickboxes = fullCatalog.filter(c => c.categoryGroup === 'Stickbox Parts');
const others = fullCatalog.filter(c => !c.categoryGroup || c.categoryGroup === 'Other Parts');
```

## 3. Accessibility Issue: Improve `CollapsibleSection` Component
**Issue:** The `CollapsibleSection` component uses an `<h2>` element with an `onClick` handler, lacking keyboard operability and ARIA states.

**Solution:** Wrap the heading text inside a `<button>` element. Apply the `onClick` handler to the button, set appropriate `aria-expanded` and `aria-controls` attributes, and inherit styles to maintain the visual appearance.

**Code Snippet:**
```tsx
const CollapsibleSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const sectionId = title.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="collapsible-section">
      <h2>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls={`sect-${sectionId}`}
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            userSelect: 'none',
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'inherit',
            font: 'inherit',
            width: '100%',
            textAlign: 'left'
          }}
        >
          <span 
            aria-hidden="true" 
            style={{ fontSize: '0.6em', transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ▶
          </span>
          {title}
        </button>
      </h2>
      {isOpen && (
        <div id={`sect-${sectionId}`} className="catalog-grid">
          {children}
        </div>
      )}
    </div>
  );
};
```
