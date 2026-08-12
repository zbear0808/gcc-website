# Plan to Fix `api/update-payment-intent.ts` Security and Math Issues

This plan addresses three major issues in the `update-payment-intent.ts` endpoint: Client Trust, Floating Point Math, and Authorization.

## 1. Frontend Updates (`src/pages/CheckoutPage.tsx`)
Currently, the frontend passes `rate.id` as `selected_shipping_rate`. To allow the backend to fetch the actual rate from EasyPost, it must pass the `shipment_id` as well.

*   **Store `shipmentId` in State:** Add `const [shipmentId, setShipmentId] = useState<string | null>(null)` to the `CheckoutForm`. Update `handleAddressChange` to store `data.shipmentId`.
*   **Update Express Checkout (Apple Pay):** Since the Apple Pay element only accepts a single string identifier for the selected rate, composite the `shipmentId` and `rate.id` together when mapping `applePayRates`:
    ```typescript
    identifier: `${data.shipmentId}|${rate.id}`,
    ```
    Then, in `onShippingRateChange`, split the identifier:
    ```typescript
    const [shipment_id, rate_id] = event.shippingRate.identifier.split('|');
    ```
*   **Update API Calls:** Modify all `fetch` calls to `/api/update-payment-intent` to send `shipment_id` and `rate_id` instead of `selected_shipping_rate`.

## 2. Backend Updates (`api/update-payment-intent.ts`)

### A. Validate Cart and Shipment (Fixing "Lack of Authorization")
A malicious user could pass a valid `payment_intent_id` (from a $2000 order) but supply a `shipment_id` for a $5 fake cart to get cheap shipping. We must verify that the shipment aligns with the actual cart state.

1. Extract the `order_id` from the PaymentIntent's metadata.
2. Fetch the cart payload from Redis (`cart:${orderId}`).
3. Calculate the expected parcel dimensions/weight using the trusted cart data.
4. Compare the EasyPost shipment parcel to the calculated parcel. If they don't match, reject the request.

```typescript
import { Redis } from '@upstash/redis';
import { calculateParcel } from '../shared/shipping';

const redis = process.env.KV_REST_API_URL
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN as string,
    })
  : null;

// 1. Retrieve the payment intent
const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
const orderId = intent.metadata.order_id;

// 2. Fetch original cart from Redis
if (!redis) return res.status(500).json({ error: 'Redis unavailable' });
const orderPayloadStr = await redis.get(`cart:${orderId}`);
if (!orderPayloadStr) return res.status(403).json({ error: 'Order not found' });
const orderPayload = typeof orderPayloadStr === 'string' ? JSON.parse(orderPayloadStr) : orderPayloadStr;

// 3. Re-calculate expected parcel
const expectedParcel = calculateParcel(orderPayload);

// 4. Validate that the provided shipment matches the cart's expected weight
if (Math.abs(shipment.parcel.weight - expectedParcel.weight) > 0.1) {
    return res.status(403).json({ error: 'Shipment validation failed. Parcel tampering detected.' });
}
```

### B. Fetch Rate from EasyPost (Fixing "Trusting the Client")
Instead of trusting an arbitrary string or number from the frontend, find the matching `rate_id` on the trusted server using the EasyPost API.

```typescript
import EasyPostClient from '@easypost/api';

const easypost = new EasyPostClient(process.env.EASYPOST_API_KEY || 'fake_key');

// Fetching shipment using shipment_id:
const shipment = await easypost.Shipment.retrieve(shipment_id);
const rate = shipment.rates.find((r: any) => r.id === rate_id);

if (!rate) {
  return res.status(400).json({ error: 'Invalid shipping rate selected.' });
}
```

### C. Safe Currency Parsing (Fixing "Floating Point Math")
The EasyPost API returns `rate.rate` as a string (e.g., `"5.49"`). Avoid `parseFloat(rate) * 100` because JS floating-point arithmetic can introduce errors (like `5.49 * 100 = 548.9999999999999`). Use exact string splitting instead:

```typescript
const [dollars, cents = '00'] = rate.rate.split('.');
const shippingCents = parseInt(dollars, 10) * 100 + parseInt((cents + '00').substring(0, 2), 10);

let baseAmount = parseInt(intent.metadata.base_amount || '0', 10);
if (!baseAmount) baseAmount = intent.amount;

const newAmount = baseAmount + shippingCents;
```

### D. Update PaymentIntent
Update the Stripe PaymentIntent with the verified `newAmount`.

```typescript
const updatedIntent = await stripe.paymentIntents.update(payment_intent_id, {
  amount: newAmount,
});

return res.status(200).json({ success: true, amount: updatedIntent.amount });
```
