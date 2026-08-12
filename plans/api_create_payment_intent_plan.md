# Plan: Resolve Issues in `api/create-payment-intent.ts`

This plan addresses three identified issues in `api/create-payment-intent.ts`: Broken Fallback Logic, Type Safety Bypass, and Excessive TTL for Cart Cache.

## 1. Broken Fallback Logic (Bug)
**Issue:** The file attempts to support a fallback mode if Redis is unavailable (e.g., bypassing Redis inventory checks). However, later in the script (around line 72), there is a strict check `if (!redis) { return res.status(500)... }`. This forces the endpoint to crash when Redis is missing, making the earlier fallback logic dead code.
**Resolution:** Make the order caching logic conditional on Redis being available, so that if `redis` is null, the endpoint can still proceed and return the `client_secret` to complete the fallback path. 

**Code Snippet Change:**
```diff
-    // Store full order payload in Redis to avoid Stripe's 500-char metadata limit
-    if (!redis) {
-      return res.status(500).json({ error: 'Order storage is unavailable. Please try again later.' });
-    }
-
     const orderId = randomUUID();
     const orderPayload = { 
       config: validConfig, customBuilds, cart, parts,
       status: 'cart',
       shipmentId, rateId, email
     };
-    await redis.set(`cart:${orderId}`, JSON.stringify(orderPayload), { ex: 604800 }); // 7-day TTL

+    // Store full order payload in Redis if available
+    if (redis) {
+      await redis.set(`cart:${orderId}`, JSON.stringify(orderPayload), { ex: 3600 }); // 1-hour TTL
+    } else {
+      console.warn('Redis unavailable, skipping order payload storage (fallback mode).');
+    }
```

## 2. Type Safety Bypass (Anti-pattern)
**Issue:** The Stripe API version is cast using `as any` (`apiVersion: '2023-10-16' as any`), which bypasses TypeScript's type checking.
**Resolution:** Remove the `as any` cast. Ensure the provided API version matches a valid string literal expected by the current version of the Stripe SDK (which is `^22.3.2` per `package.json`), or simply omit the `apiVersion` if it's acceptable for the SDK to use its default version.

**Code Snippet Change:**
```diff
 const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
-  apiVersion: '2023-10-16' as any,
+  apiVersion: '2023-10-16', // Use the valid exact literal if supported, or upgrade/omit entirely
 });
```

## 3. Excessive TTL for Cart Cache
**Issue:** The Redis TTL is currently set to 7 days (604800 seconds). For standard e-commerce, retaining cart payload and reserved intent state for a whole week can lock up inventory unnecessarily and cause stale pricing issues.
**Resolution:** Reduce the TTL to a shorter duration, such as 1 hour (3600 seconds) or 24 hours (86400 seconds), which is sufficient for completing a checkout session.

**Code Snippet Change:**
See the code snippet in section 1 above where the TTL was updated to 3600 (1 hour):
```diff
-    await redis.set(`cart:${orderId}`, JSON.stringify(orderPayload), { ex: 604800 }); // 7-day TTL
+    await redis.set(`cart:${orderId}`, JSON.stringify(orderPayload), { ex: 3600 }); // 1-hour TTL
```
