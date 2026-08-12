# AdminPage Issue Resolution Plan

This plan details the steps to address architectural, security, type safety, and UX issues in `AdminPage.tsx` and `AdminPage.css`.

## 1. CSS Architectural / Maintainability Issue

**Problem:** `AdminPage.css` and inline styles in `AdminPage.tsx` use hardcoded hex colors, which limits maintainability and makes theming (like dark mode) difficult.

**Solution:** Define CSS variables (design tokens) at the `:root` level (or a dedicated theme file) and use them across all stylesheets and inline styles. Inline styles in `AdminPage.tsx` should be migrated to CSS classes.

**Code Snippet / Example:**
```css
/* AdminPage.css */
:root {
  --admin-bg-primary: #111;
  --admin-bg-secondary: #222;
  --admin-border: #333;
  --admin-border-light: #444;
  --admin-text-primary: #ffffff;
  --admin-accent: #4ade80;
  --admin-accent-hover: #22c55e;
  --admin-error: #ef4444;
}

.admin-login-container {
  background: var(--admin-bg-primary);
  border: 1px solid var(--admin-border);
}
```
*Also, move inline styles in `AdminPage.tsx` (e.g. lines 143, 150) to `AdminPage.css` using these variables.*

## 2. Security Anti-pattern

**Problem:** The application handles authentication by storing a plaintext password in React state and sending it as a custom header (`Authorization: Bearer ${password}` or `x-admin-secret`) with every request.

**Solution:** Update the API to support token-based or cookie-based authentication. The `login` endpoint should issue an `HttpOnly` cookie or a JWT upon successful authentication. Remove the password from React state immediately after login, and remove explicit header injection from subsequent fetch calls.

**Code Snippet / Example:**
```tsx
const login = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    // Exchange password for session cookie / token
    const res = await fetch('/api/admin/login', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }) 
    });
    if (res.ok) {
      setPassword(''); // Clear password from memory
      setIsAuthenticated(true);
      fetchData(); // Load orders/inventory
    } else {
      setError('Invalid credentials');
    }
  } catch (err) {
    setError('Login failed');
  }
  setLoading(false);
};

const fulfillOrder = async (orderId: string) => {
  // Credentials (cookie) are handled automatically by the browser
  const res = await fetch('/api/admin/fulfill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId })
  });
  // ...
};
```

## 3. TypeScript Bug: Order ID casting

**Problem:** The `id` property on orders is accessed by explicitly casting to `any` because of missing properties on the shared `RedisOrder` type.

**Solution:** Ensure the `RedisOrder` interface in `@shared/types.ts` has the `id: string` property properly defined. Remove any `(order as any).id` casts in `AdminPage.tsx`. (Note: The interface might currently have it, but any residual casts in the application should be cleaned up to rely purely on the correct types).

**Code Snippet / Example:**
```typescript
// shared/types.ts
export interface RedisOrder extends CheckoutPayload {
  id: string; // Ensure this is defined explicitly
  status: 'cart' | 'paid' | 'shipped';
  // ...
}

// AdminPage.tsx - Remove casts
// Before: (order as any).id
// After:
setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
```

## 4. Single Page App Anti-pattern: Full-page Reloads

**Problem:** The "Refresh Data" button triggers `window.location.reload()`, causing a full browser refresh rather than fetching new data asynchronously.

**Solution:** Implement a `fetchData` function to retrieve orders and inventory via API, and attach it to the refresh button.

**Code Snippet / Example:**
```tsx
const fetchData = async () => {
  setLoading(true);
  try {
    const ordersRes = await fetch('/api/admin/orders'); // Assuming credentials are sent automatically
    if (ordersRes.ok) {
      const data = await ordersRes.json();
      setOrders(data.orders);
    }
    const invRes = await fetch('/api/inventory');
    if (invRes.ok) {
      setInventory(await invRes.json());
    }
  } catch (err) {
    console.error('Failed to refresh data');
  }
  setLoading(false);
};

// In JSX
<button className="refresh-btn" onClick={fetchData} disabled={loading}>
  Refresh Data
</button>
```

## 5. UX Anti-pattern: Native Browser Alerts

**Problem:** Actions like `fulfillOrder` and `saveInventory` use native `alert()` dialogs to display success or error messages, which blocks the UI thread and provides a poor user experience.

**Solution:** Replace `alert()` calls with a non-blocking toast notification system (e.g., `react-hot-toast`) or an inline message state.

**Code Snippet / Example:**
```tsx
// Using a feedback state or toast library
const saveInventory = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await fetch('/api/inventory', { /* ... */ });
    if (res.ok) {
      // e.g., toast.success('Inventory saved successfully!');
      setFeedback({ type: 'success', message: 'Inventory saved successfully!' });
    } else {
      const data = await res.json();
      // e.g., toast.error(`Failed: ${data.error}`);
      setFeedback({ type: 'error', message: `Failed: ${data.error}` });
    }
  } catch (err) {
    setFeedback({ type: 'error', message: 'Error saving inventory' });
  }
  setLoading(false);
};
```
