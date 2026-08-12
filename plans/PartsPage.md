# PartsPage.tsx Technical Debt Resolution Plan

## 1. TypeScript Bug: Cart Total Fallback & Type Checking
**Problem:**
`PartsPage.tsx` currently defines a custom `cartTotal()` function that checks `typeof store.cartTotal === 'function'` and falls back to manually iterating over `fullCatalog` to recalculate item totals. This introduces unnecessary complexity, potential `@ts-ignore` suppressions, and redundant logic that duplicates `useStore.cartTotal()` / `@shared/pricing`.

**Solution:**
Remove the custom `cartTotal()` fallback function inside `PartsPage.tsx` and directly invoke `store.cartTotal()`. `useStore` already guarantees `cartTotal` is available and strongly typed.

**Implementation Steps:**
- Remove the local `cartTotal()` helper function within `PartsPage.tsx`.
- Replace `{formatPrice(cartTotal())}` with `{formatPrice(store.cartTotal())}` directly in the JSX cart summary section.

**Code Snippet:**
```tsx
// Before:
const cartTotal = () => {
  if (typeof store.cartTotal === 'function') {
    return store.cartTotal();
  }
  let total = 0;
  Object.entries(store.cart).forEach(([id, qty]) => {
    const category = fullCatalog.find(c => c.subtypes.some(i => i.id === id));
    const item = category?.subtypes.find(i => i.id === id);
    if (item) {
      total += (item.price || 0) * qty;
    }
  });
  return total;
};

// After:
<div className="cart-summary">
  <span>Total: ${formatPrice(store.cartTotal())}</span>
  <button onClick={() => navigate('/cart')}>View Cart</button>
</div>
```

---

## 2. Architectural Issue: Hardcoded Category Arrays
**Problem:**
Category IDs (`electronicsIds`, `shellsAndButtonsIds`, `mechanicalTriggerIds`, `stickboxIds`) are hardcoded as static string arrays directly inside the component body. This tightly couples UI rendering with specific data identifiers, causes array recreations on each render, and requires modifying component code whenever catalog items change.

**Solution:**
Extract category groupings into a centralized domain configuration (e.g., in `@shared/catalog` or a dedicated constant) and derive the rendered sections dynamically.

**Implementation Steps:**
- Define `PARTS_CATEGORY_GROUPS` outside the component or in `@shared/catalog`.
- Use `useMemo` in `PartsPage.tsx` to group categories dynamically based on the central configuration.
- Iterate over the grouped category map to render `CollapsibleSection` elements dynamically.

**Code Snippet:**
```typescript
// Shared configuration object (e.g., in @shared/catalog or constants):
export const PARTS_CATEGORY_GROUPS = [
  {
    title: 'Cosmetic Parts',
    ids: ['shells', 'buttons', 'wii-caps', 'membranes', 'stick-caps'],
  },
  {
    title: 'Stickbox Parts',
    ids: ['stickbox', 'stickbox-t1-t2', 'magnet-mount', 'dh1212-magnet', 'stickbox-pot'],
  },
  {
    title: 'Electronic Parts',
    ids: [
      'board-only', 'board-oem', 'cables', 'rumble-motors', 'slider-pots',
      '6-pin-ribbon-cable', 'trigger-paddle-pcbs', 'z-buttons'
    ],
  },
  {
    title: 'Mechanical Trigger Mod',
    ids: ['switch-kailh-choco', 'jst-pigtail-header', 'switch-mount-3d'],
  },
] as const;
```

```tsx
// In PartsPage.tsx:
const sectionData = useMemo(() => {
  const categorizedIds = new Set(PARTS_CATEGORY_GROUPS.flatMap(g => g.ids));
  const grouped = PARTS_CATEGORY_GROUPS.map(group => ({
    title: group.title,
    categories: fullCatalog.filter(c => group.ids.includes(c.id as any))
  }));
  const uncategorized = fullCatalog.filter(c => !categorizedIds.has(c.id));
  if (uncategorized.length > 0) {
    grouped.push({ title: 'Other Parts', categories: uncategorized });
  }
  return grouped;
}, []);
```

---

## 3. Accessibility Issue: Interactive Heading Lacks ARIA & Keyboard Support
**Problem:**
The `CollapsibleSection` component assigns an `onClick` handler directly to an `<h2>` element without ARIA attributes (`aria-expanded`, `aria-controls`), button semantics, or keyboard listeners (`onKeyDown`). Keyboard users cannot focus or toggle sections, and screen readers cannot discern section collapse states.

**Solution:**
Refactor `CollapsibleSection` to wrap the heading label in a native `<button>` element with appropriate `aria-expanded` and `aria-controls` attributes.

**Implementation Steps:**
- Replace `<h2 onClick=...>` with a native `<button type="button">` element inside `<h2>`.
- Pass `aria-expanded={isOpen}` to the button element.
- Provide a unique `id` for the collapsible content container and link it to the button via `aria-controls`.
- Mark decorative disclosure triangle icons with `aria-hidden="true"`.

**Code Snippet:**
```tsx
const CollapsibleSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const sectionId = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div className="collapsible-section">
      <h2>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls={sectionId}
          className="collapsible-trigger"
        >
          <span
            aria-hidden="true"
            style={{
              fontSize: '0.6em',
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              display: 'inline-block'
            }}
          >
            ▶
          </span>
          {title}
        </button>
      </h2>
      {isOpen && (
        <div id={sectionId} className="catalog-grid">
          {children}
        </div>
      )}
    </div>
  );
};
```
