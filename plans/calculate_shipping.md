# Resolution Plan for `api/calculate-shipping.ts`

This resolution plan outlines the architectural and implementation updates required to resolve three major technical debt issues in [`api/calculate-shipping.ts`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/api/calculate-shipping.ts):

1. **Hardcoded Values (US)**
2. **Insufficient Input Validation**
3. **Floating-Point Conversions**

---

## 1. Issue Analysis & Resolution Strategy

### Issue 1: Hardcoded Values (US)
* **Location:** [`api/calculate-shipping.ts#L27`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/api/calculate-shipping.ts#L27) and [`L33`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/api/calculate-shipping.ts#L33)
* **Problem:** 
  - `to_address.country` is hardcoded to `'US'`, forcing all destination address shipping rate calculations to be treated as domestic US shipments even when international parameters are passed.
  - `from_address.country` is hardcoded to `'US'` without environment configuration fallback.
* **Proposed Resolution:**
  - Support dynamic destination country parameter (`country` or `to_country`) extracted from `req.body`, defaulting to `'US'` if not provided for backwards compatibility.
  - Support `process.env.SHIPPING_ORIGIN_COUNTRY || 'US'` for origin country to enable flexible international shipping origins.

### Issue 2: Insufficient Input Validation
* **Location:** [`api/calculate-shipping.ts#L17-L22`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/api/calculate-shipping.ts#L17-L22)
* **Problem:** 
  - The endpoint only verifies `if (!zip)`. It does not validate `req.body` existence or structure.
  - `calculateParcel(req.body)` is invoked directly on unvalidated request input. Malformed payloads (such as non-object `cart` or invalid `customBuilds`) will cause runtime errors or unhandled exceptions.
* **Proposed Resolution:**
  - Implement comprehensive input validation for `req.body`, verifying that `zip` is a non-empty string, optional `country` is a valid 2-letter ISO code string, and nested fields (`cart`, `customBuilds`, `config`, `parts`) match expected structural types before passing to `calculateParcel()`.
  - Return clear `400 Bad Request` status codes with structured error messages when validation fails.

### Issue 3: Floating-Point Conversions
* **Location:** [`api/calculate-shipping.ts#L47`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/api/calculate-shipping.ts#L47)
* **Problem:** 
  - `parseFloat(rate.rate)` converts EasyPost's string rate representation (e.g. `"5.49"`) to standard IEEE 754 floating-point numbers.
  - Performing operations on floating-point currency numbers can lead to binary rounding inaccuracies (e.g., `5.49 * 100 = 549.0000000000001`), which can cause discrepancies when interfacing with payment systems like Stripe that require integer amounts in cents.
* **Proposed Resolution:**
  - Convert shipping rates to integer cents (`rateInCents`) using integer arithmetic / `Math.round(parseFloat(rate.rate) * 100)` to eliminate floating-point representation bugs.
  - Provide both integer monetary units (`rateInCents`) and formatted decimal strings or floats where backwards compatibility is required.

---

## 2. Proposed Code Modifications

```diff
--- a/api/calculate-shipping.ts
+++ b/api/calculate-shipping.ts
@@ -14,19 +14,30 @@ export default async function handler(req: VercelRequest, res: VercelResponse) {
   }

   try {
-    const { zip } = req.body || {};
-    if (!zip) {
-      return res.status(400).json({ error: 'Destination zip code is required' });
+    const body = req.body;
+    if (!body || typeof body !== 'object') {
+      return res.status(400).json({ error: 'Invalid or missing request body' });
+    }
+
+    const { zip, country = 'US' } = body;
+    if (!zip || typeof zip !== 'string' || zip.trim() === '') {
+      return res.status(400).json({ error: 'Destination zip code is required' });
+    }
+    if (typeof country !== 'string' || country.trim().length !== 2) {
+      return res.status(400).json({ error: 'Destination country must be a 2-letter ISO country code' });
     }

-    const parcel = calculateParcel(req.body);
+    const parcel = calculateParcel(body);

     const shipment = await easypost.Shipment.create({
       to_address: {
-        zip,
-        country: 'US',
+        zip: zip.trim(),
+        country: country.trim().toUpperCase(),
       },
       from_address: {
         zip: process.env.SHIPPING_ORIGIN_ZIP || '98122',
         city: process.env.SHIPPING_ORIGIN_CITY || 'Seattle',
         state: process.env.SHIPPING_ORIGIN_STATE || 'WA',
-        country: 'US',
+        country: process.env.SHIPPING_ORIGIN_COUNTRY || 'US',
       },
       parcel: {
         weight: parcel.weight,
@@ -44,7 +55,8 @@ export default async function handler(req: VercelRequest, res: VercelResponse) {
       id: rate.id,
       service: rate.service,
       carrier: rate.carrier,
-      rate: parseFloat(rate.rate),
+      rate: parseFloat(rate.rate), // Retained for backwards compatibility
+      rateInCents: Math.round(parseFloat(rate.rate) * 100), // Integer cents representation
     }));

     return res.status(200).json({ rates, shipmentId: shipment.id });
```

---

## 3. Verification & Testing Steps

1. **Unit & Integration Tests:**
   - Verify `calculate-shipping` endpoint returns `400 Bad Request` on missing `zip`, invalid `country`, or non-object body.
   - Verify domestic (US) and international shipping destination addresses process correctly.
   - Verify `rateInCents` matches exact expected integer cent values (e.g. `"12.50"` -> `1250`).
2. **Environment Variable Configuration:**
   - Confirm fallback behavior when `SHIPPING_ORIGIN_COUNTRY` is unset or set to standard values.
