# Plan: Resolve Issues in `api/calculate-shipping.ts`

This document outlines the proposed changes to address the architectural and code quality issues identified in the `api/calculate-shipping.ts` file.

## 1. Hardcoded Values (Architectural Issue)

**Issue**: The `to_address` and `from_address` have their country hardcoded to `'US'`, restricting the system to domestic shipping.

**Proposed Resolution**:
- The frontend (`CheckoutPage.tsx`) already sends `country` in the request body. We need to extract this and use it instead of the hardcoded `'US'` value.
- For the `from_address`, we should use an environment variable `SHIPPING_ORIGIN_COUNTRY` with a fallback to `'US'` to allow easy configuration without code changes.

**Code Snippet**:
```typescript
// Extract country from req.body
const { zip, country } = req.body || {};
if (!zip || !country) {
  return res.status(400).json({ error: 'Destination zip and country are required' });
}

// ...

const shipment = await easypost.Shipment.create({
  to_address: {
    zip,
    country: country, // Use country from request
  },
  from_address: {
    zip: process.env.SHIPPING_ORIGIN_ZIP || '98122',
    city: process.env.SHIPPING_ORIGIN_CITY || 'Seattle',
    state: process.env.SHIPPING_ORIGIN_STATE || 'WA',
    country: process.env.SHIPPING_ORIGIN_COUNTRY || 'US', // Use environment variable
  },
  // ...
});
```

## 2. Insufficient Input Validation

**Issue**: The endpoint only checks if `zip` exists. It doesn't validate the structure of `req.body` (like `cart`, `customBuilds`, etc.) before passing it to `calculateParcel(req.body)`, which expects a `CheckoutPayload`.

**Proposed Resolution**:
- Add validation logic for the request body before processing. We can implement a manual check to ensure `cart`, `customBuilds`, and `config` are in the expected format, or use a schema validation library like `zod`.
- For minimal dependency additions, we will add standard runtime checks.

**Code Snippet**:
```typescript
const payload = req.body;

// Validate the basic payload structure
if (payload.cart && typeof payload.cart !== 'object') {
  return res.status(400).json({ error: 'Invalid cart format' });
}
if (payload.customBuilds && !Array.isArray(payload.customBuilds)) {
  return res.status(400).json({ error: 'Invalid customBuilds format' });
}

// Now safely pass to calculateParcel
const parcel = calculateParcel(payload);
```
*Note: If `zod` is added to the project later, we can replace this with a more robust `CheckoutPayloadSchema.parse(req.body)` call.*

## 3. Floating-Point Conversions

**Issue**: Using `parseFloat(rate.rate)` on currency can lead to precision loss. It's safer to work in integer cents.

**Proposed Resolution**:
- The EasyPost API returns the `rate` as a string (e.g., `"5.49"`). We will convert this directly to integer cents by parsing it and multiplying by 100, then rounding to avoid any floating-point inaccuracies.
- We will also need to update the `CheckoutPage.tsx` component to handle the updated `rate` format, as it currently expects a string/float value.

**Code Snippet (`api/calculate-shipping.ts`)**:
```typescript
const rates = shipment.rates.map((rate: any) => ({
  id: rate.id,
  service: rate.service,
  carrier: rate.carrier,
  // Convert string (e.g. "5.49") to integer cents (e.g. 549)
  rateInCents: Math.round(parseFloat(rate.rate) * 100),
}));
```

**Required Frontend Update (`src/pages/CheckoutPage.tsx`)**:
```typescript
// When passing to Stripe (Apple Pay)
const applePayRates = (data.rates || []).map((rate: any) => ({
  label: rate.service,
  amount: rate.rateInCents, // Directly use cents
  identifier: rate.id,
  detail: 'Standard shipping'
}));

// When displaying to the user
{rate.service} - ${(rate.rateInCents / 100).toFixed(2)}
```
