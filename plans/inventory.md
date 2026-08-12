# Technical Debt & Vulnerability Resolution Plan: `api/inventory.ts`

This plan details the resolution strategy for technical debt and security vulnerabilities identified in [`api/inventory.ts`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/api/inventory.ts).

---

## 1. N+1 Redis Queries

### Problem & Impact
In the `POST` handler, incoming updates are iterated using `Object.entries(updates).map(...)` where each entry issues an individual `redis.hset('inventory', { [id]: Number(qty) })` call wrapped in `Promise.all(...)`.
For $N$ items being updated, this results in $N$ separate network requests over HTTP to Upstash Redis. This pattern introduces unnecessary network latency, high request overhead, and rate-limiting risks on Redis.

### Proposed Solution
Upstash Redis `@upstash/redis` `hset` command natively accepts an object containing multiple field-value pairs in a single operation: `redis.hset('inventory', validUpdates)`. 
By accumulating validated updates into a `validUpdates` object, all item inventory levels can be persisted in a single batch Redis network call.

### Code Changes
```typescript
// Replace multiple hset calls inside Promise.all
if (redis) {
  if (Object.keys(validUpdates).length > 0) {
    await redis.hset('inventory', validUpdates);
  }
  return res.status(200).json({ success: true });
}
```

---

## 2. Lack of Payload Validation

### Problem & Impact
The `POST` request payload (`req.body`) is assigned to `updates` and checked only with `if (!updates || typeof updates !== 'object')`.
This check has several severe flaws:
1. `typeof null` in JavaScript returns `'object'`, causing `Object.entries(null)` to throw a runtime `TypeError`.
2. Arrays return `'object'` for `typeof`, allowing an array body to bypass the check and write array index keys into Redis.
3. Item IDs are not validated against known catalog items in [`shared/catalog.ts`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/shared/catalog.ts), permitting arbitrary key insertion into Redis (cache pollution).
4. Quantities are parsed with `Number(qty)` without checking for `NaN`, negative values, non-integer numbers, or non-numeric types.

### Proposed Solution
1. Validate object type strictly: `typeof updates === 'object' && updates !== null && !Array.isArray(updates)`.
2. Iterate through each `[id, qty]` entry:
   - Check if `id` exists in `allItems` catalog.
   - Verify `qty` is a valid, non-negative integer number: `typeof qty === 'number' && Number.isInteger(qty) && qty >= 0`.
3. Reject invalid requests with `400 Bad Request` and a descriptive error message.

### Code Changes
```typescript
const updates = req.body;
if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
  return res.status(400).json({ error: 'Invalid payload: expected an object of item updates' });
}

const validUpdates: Record<string, number> = {};
for (const [id, qty] of Object.entries(updates)) {
  const item = allItems.find(i => i.id === id);
  if (!item) {
    return res.status(400).json({ error: `Invalid item ID: ${id}` });
  }
  if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 0) {
    return res.status(400).json({ error: `Invalid quantity for ${id}: must be a non-negative integer` });
  }
  validUpdates[id] = qty;
}
```

---

## 3. Header Type Vulnerability

### Problem & Impact
The authentication check reads `const adminSecret = req.headers['x-admin-secret'];` and compares it directly: `adminSecret !== process.env.ADMIN_SECRET`.
In HTTP/Node.js request handlers (such as Vercel serverless functions), request headers can be of type `string | string[] | undefined`. If an attacker passes multiple `x-admin-secret` headers, Node parses `req.headers['x-admin-secret']` as an array (e.g. `['secret1', 'secret2']`).
Comparing an array to a string using `!==` leads to unexpected behavior and type mismatches. Furthermore, if `process.env.ADMIN_SECRET` is not set or empty, unexpected header evaluation could occur.

### Proposed Solution
1. Extract and normalize the header value to a single string:
   ```typescript
   const rawHeader = req.headers['x-admin-secret'];
   const adminSecret = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
   ```
2. Verify `process.env.ADMIN_SECRET` is configured.
3. Perform a strict string comparison check.

### Code Changes
```typescript
const rawHeader = req.headers['x-admin-secret'];
const adminSecret = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

const expectedSecret = process.env.ADMIN_SECRET;
if (!expectedSecret || typeof adminSecret !== 'string' || adminSecret !== expectedSecret) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

---

## Complete Refactored Handler (`api/inventory.ts`)

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { allItems } from '../shared/catalog';

const redis = process.env.KV_REST_API_URL
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN as string,
    })
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      if (redis) {
        const inventory = await redis.hgetall('inventory');
        const filteredInventory: Record<string, number> = {};
        for (const [id, qty] of Object.entries(inventory || {})) {
          const item = allItems.find(i => i.id === id);
          if (item?.requiresInventory !== false) {
            filteredInventory[id] = Number(qty);
          }
        }
        return res.status(200).json(filteredInventory);
      } else {
        // Fallback for local development
        if (process.env.NODE_ENV !== 'production') {
          const fallback: Record<string, number> = {};
          for (const item of allItems) {
            if (item.requiresInventory !== false) {
              fallback[item.id] = 10;
            }
          }
          return res.status(200).json(fallback);
        } else {
          return res.status(200).json({});
        }
      }
    } catch (error: any) {
      console.error('Inventory GET error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  if (req.method === 'POST') {
    const rawHeader = req.headers['x-admin-secret'];
    const adminSecret = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    const expectedSecret = process.env.ADMIN_SECRET;

    if (!expectedSecret || typeof adminSecret !== 'string' || adminSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const updates = req.body;
      if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
        return res.status(400).json({ error: 'Invalid payload: expected an object of item updates' });
      }

      const validUpdates: Record<string, number> = {};
      for (const [id, qty] of Object.entries(updates)) {
        const item = allItems.find(i => i.id === id);
        if (!item) {
          return res.status(400).json({ error: `Invalid item ID: ${id}` });
        }
        if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 0) {
          return res.status(400).json({ error: `Invalid quantity for ${id}: must be a non-negative integer` });
        }
        validUpdates[id] = qty;
      }

      if (redis) {
        if (Object.keys(validUpdates).length > 0) {
          await redis.hset('inventory', validUpdates);
        }
        return res.status(200).json({ success: true });
      } else {
        return res.status(200).json({ success: true, note: 'Redis not configured, simulated success.' });
      }
    } catch (error: any) {
      console.error('Inventory POST error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
```

---

## Verification & Test Plan

1. **Header Validation Test**:
   - Send `POST /api/inventory` with no `x-admin-secret` header -> Verify `401 Unauthorized`.
   - Send `POST /api/inventory` with array of headers `x-admin-secret: ['wrong', 'correct']` -> Verify single string extraction and accurate authentication check.
   - Send `POST /api/inventory` with valid `x-admin-secret` -> Verify authorization succeeds.

2. **Payload Validation Test**:
   - Send `POST /api/inventory` with `null`, array `[]`, or non-object body -> Verify `400 Bad Request`.
   - Send body with unknown item ID `{ "nonexistent-item": 5 }` -> Verify `400 Bad Request`.
   - Send body with invalid quantities `{ "item-1": -5 }`, `{ "item-1": "10" }`, or `{ "item-1": NaN }` -> Verify `400 Bad Request`.

3. **Redis Single-Query Batching Test**:
   - Mock/observe Redis commands during `POST` with multi-item payload e.g. `{ "item-1": 5, "item-2": 10 }`.
   - Verify `redis.hset` is called exactly once with object `{ "item-1": 5, "item-2": 10 }`.
