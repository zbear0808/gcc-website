# Plan to Resolve api/inventory.ts Issues

This document outlines the changes needed to resolve the issues found in `api/inventory.ts`.

## 1. Header Type Vulnerability (Bug)
**Issue:** `req.headers['x-admin-secret']` is compared directly to a string. In Node/Vercel, if multiple identical headers are passed, the header becomes an array of strings. The strict equality check `===` will then fail, causing unexpected authentication errors.
**Resolution:** Check if the header is an array and use the first element, or ensure it's a string before performing the comparison.

**Proposed Code Change:**
```typescript
-    const adminSecret = req.headers['x-admin-secret'];
-    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
+    const adminSecretHeader = req.headers['x-admin-secret'];
+    const adminSecret = Array.isArray(adminSecretHeader) ? adminSecretHeader[0] : adminSecretHeader;
+    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
```

## 2. Lack of Payload Validation
**Issue:** The POST endpoint blindly iterates over `req.body` and updates Redis without validating if the item IDs actually exist in the catalog or if the quantities are valid, non-negative numbers. This could easily lead to cache pollution.
**Resolution:** Iterate over the `updates` object and validate each key against `allItems`. Verify that the quantity is a non-negative number. Store validated properties in a new `validUpdates` object.

**Proposed Code Change:**
```typescript
       const updates = req.body;
       if (!updates || typeof updates !== 'object') {
         return res.status(400).json({ error: 'Invalid payload' });
       }
+
+      const validUpdates: Record<string, number> = {};
+      for (const [id, qty] of Object.entries(updates)) {
+        const item = allItems.find(i => i.id === id);
+        if (!item) {
+          return res.status(400).json({ error: `Invalid item ID: ${id}` });
+        }
+        const quantity = Number(qty);
+        if (isNaN(quantity) || quantity < 0) {
+          return res.status(400).json({ error: `Invalid quantity for ${id}: ${qty}` });
+        }
+        validUpdates[id] = quantity;
+      }
```

## 3. N+1 Redis Queries (Anti-pattern)
**Issue:** Iterating over `updates` and performing a separate `redis.hset` for every single item concurrently via `Promise.all()` creates unnecessary network overhead.
**Resolution:** Redis `HSET` allows updating multiple fields in a single command. Use the validated `validUpdates` object directly in a single `redis.hset` call instead of using `Promise.all()`.

**Proposed Code Change:**
```typescript
       if (redis) {
-        const promises = Object.entries(updates).map(([id, qty]) => {
-          return redis.hset('inventory', { [id]: Number(qty) });
-        });
-        await Promise.all(promises);
+        if (Object.keys(validUpdates).length > 0) {
+          await redis.hset('inventory', validUpdates);
+        }
         return res.status(200).json({ success: true });
```
