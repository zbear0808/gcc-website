# Resolution Plan: `api/update-payment-intent.ts`

## 1. Overview & Context
The [`api/update-payment-intent.ts`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/api/update-payment-intent.ts) endpoint is responsible for updating an active Stripe `PaymentIntent` total amount when a customer selects or changes their shipping rate during checkout.

Currently, the endpoint suffers from three severe architectural and security vulnerabilities:
1. **Critical Security Flaw (Trusting the Client for shipping amount)**
2. **Floating Point Math for Currency Calculations**
3. **Lack of Authorization and PaymentIntent State Validation**

---

## 2. Issues Analysis

### Issue A: Critical Security Flaw – Client-Controlled Shipping Amounts
- **Current Behavior**:
  ```ts
  const { payment_intent_id, selected_shipping_rate } = req.body || {};
  const shippingCents = Math.round(parseFloat(selected_shipping_rate) * 100);
  const newAmount = baseAmount + shippingCents;
  ```
- **Vulnerability**:
  - The endpoint assumes `selected_shipping_rate` is a client-provided dollar amount string (e.g. `"15.00"`).
  - A malicious actor can intercept or construct HTTP POST requests containing negative or zero shipping rates (e.g. `selected_shipping_rate: "-50.00"` or `0`), artificially reducing the total order cost on Stripe.
  - In addition, the frontend code in [`src/pages/CheckoutPage.tsx`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/src/pages/CheckoutPage.tsx) actually passes rate IDs (e.g., `rate_xxx` or `express`) as `selected_shipping_rate`. When passed to `parseFloat("rate_xxx")`, it produces `NaN`, leading to corrupted Stripe API payloads.

### Issue B: Floating Point Math for Currency
- **Current Behavior**:
  ```ts
  const shippingCents = Math.round(parseFloat(selected_shipping_rate) * 100);
  ```
- **Vulnerability**:
  - Relying on `parseFloat` and IEEE 754 floating point multiplication (`* 100`) introduces precision artifacts (e.g., `19.99 * 100 = 1998.9999999999998`).
  - While `Math.round` mitigates small inaccuracies, floating-point operations across financial endpoints risk off-by-one cent discrepancy edge cases and violate strict integer-cents currency standards used by Stripe.

### Issue C: Lack of Authorization & State Validation
- **Current Behavior**:
  - The endpoint directly calls `stripe.paymentIntents.retrieve(payment_intent_id)` and updates `amount` without verifying caller authorization or checking if the payment intent is in a mutable state.
- **Vulnerability**:
  - Anyone with a valid `payment_intent_id` string can invoke `/api/update-payment-intent` to modify payment amounts.
  - If a `PaymentIntent` has already been authorized, processing, or succeeded (`succeeded`, `processing`, `requires_capture`), calling `update` can lead to Stripe API errors or inconsistent payment states.

---

## 3. Resolution Strategy

### 1. Server-Side Rate Resolution (Fixing Security Flaw)
- Change request body contract to accept `shipment_id` (or `shipmentId`) and `rate_id` (or `rateId`) instead of an unverified raw dollar amount.
- Retrieve the corresponding rate server-side using EasyPost (`easypost.Shipment.retrieve(shipmentId)`) or Redis-cached order session rates.
- Verify that `rate_id` exists in the retrieved shipment rates and pull the official server-validated rate amount.

### 2. Standardized Integer Cents Arithmetic (Fixing Currency Math)
- Convert verified shipping dollar rates directly into integer cents using reliable integer parsing/scaling (e.g., `Math.round(Number(rate.rate) * 100)` or string-based decimal parsing `Math.round(parseFloat(rate.rate) * 100)` at the rate boundary).
- Maintain all `baseAmount`, `shippingCents`, and `newAmount` variables strictly as integer cents.
- Validate that `shippingCents` is a non-negative finite integer (`Number.isInteger(shippingCents) && shippingCents >= 0`).

### 3. PaymentIntent Authorization & Status Guards (Fixing Authorization)
- Retrieve the target `PaymentIntent` and verify:
  1. **Status Guard**: Ensure `intent.status === 'requires_payment_method'` or `intent.status === 'requires_confirmation'`. Reject requests if the intent is `succeeded`, `processing`, or `canceled`.
  2. **Metadata Integrity**: Ensure `intent.metadata.base_amount` exists and matches the original subtotal.
  3. **Client Authorization**: Validate request authorization header or matching client secret if supplied, ensuring caller is authorized to modify the given PaymentIntent.

---

## 4. Implementation Steps

### Step 1: Update `api/update-payment-intent.ts` API Handler
- Import `EasyPostClient` and retrieve EasyPost rates securely.
- Extract `payment_intent_id`, `shipment_id`, and `rate_id` from `req.body`.
- Fetch `PaymentIntent` from Stripe and validate its status.
- Fetch EasyPost shipment by `shipment_id`, find matching `rate_id`, and extract rate price.
- Calculate `newAmount = baseAmount + shippingCents` strictly in integer cents.
- Call `stripe.paymentIntents.update(payment_intent_id, { amount: newAmount })`.
- Return updated amount to client.

### Step 2: Synchronize Frontend Client (`src/pages/CheckoutPage.tsx`)
- Update calls to `/api/update-payment-intent` to send `{ payment_intent_id, shipment_id, rate_id }`.

---

## 5. Verification Plan

1. **Security Testing**:
   - Send tampered POST requests containing negative or modified shipping amounts; verify they are ignored/rejected.
   - Send invalid or fabricated `rate_id` values; verify `400 Bad Request` response.
2. **Currency Precision Testing**:
   - Test shipping rates with fractional cent possibilities (e.g., $5.99, $12.50, $0.00). Ensure total calculated cents match exact expectations without rounding loss.
3. **Authorization & State Validation Testing**:
   - Attempt updating a `PaymentIntent` that is already in `succeeded` status; verify endpoint returns `400` or `409` conflict error.
   - Test updating valid `requires_payment_method` PaymentIntents and verify successful Stripe update.
