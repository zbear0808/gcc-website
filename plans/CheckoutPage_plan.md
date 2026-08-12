# CheckoutPage.tsx Refactoring Plan

This document outlines the proposed changes to resolve the identified issues in `src/pages/CheckoutPage.tsx`.

## 1. Fragile Logic / Bug (Payment Intent ID Extraction)
**Issue:** 
The application currently extracts the Payment Intent ID by splitting the `clientSecret` string (`clientSecret.split('_secret')[0]`). This is a fragile approach that relies on undocumented, internal Stripe string formats.

**Solution:**
The backend API (`api/create-payment-intent.ts`) already returns both `client_secret` and `id` (which is the Payment Intent ID). We should capture this `id` in the `CheckoutPage` component's state and pass it down as a prop to the `CheckoutForm`. We can then use this explicitly passed ID when calling `update-payment-intent`, removing the string manipulation.

**Proposed Code Snippets:**
```tsx
// 1. Update CheckoutPage state to store the paymentIntentId
export default function CheckoutPage() {
  const store = useStore();
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState(''); // New state
  // ...

  useEffect(() => {
    const fetchIntent = async () => {
      // ...
      if (!res.ok) { /* handle error */ }
      
      setClientSecret(data.client_secret);
      setPaymentIntentId(data.id); // Save the ID returned from backend
      // ...
    };
    fetchIntent();
  }, [store.cart, store.customBuilds]);

  // ...
  return (
    <Elements stripe={stripePromise} options={options}>
      {/* Pass paymentIntentId as a prop */}
      <CheckoutForm clientSecret={clientSecret} paymentIntentId={paymentIntentId} />
    </Elements>
  );
}

// 2. Update CheckoutForm to accept and use paymentIntentId
const CheckoutForm = ({ clientSecret, paymentIntentId }: { clientSecret: string; paymentIntentId: string }) => {
  // ...
  const handleRateSelection = async (rateId: string) => {
    setSelectedRate(rateId);
    try {
      // Replace the split logic: const pi = clientSecret.split('_secret')[0];
      await fetch(`${API_BASE}/api/update-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_intent_id: paymentIntentId, // Use explicit ID
          selected_shipping_rate: rateId
        })
      });
    } catch (e) {
      console.error(e);
    }
  };
  // ...
}
```

## 2. TypeScript Issue (Widespread usage of `any`)
**Issue:** 
The `CheckoutForm` uses `any` for event objects in Stripe Elements callbacks, entirely bypassing type safety.

**Solution:**
Import the appropriate TypeScript interfaces from `@stripe/stripe-js` (e.g. `StripeExpressCheckoutElementShippingRateChangeEvent`) and apply them to the callback handlers, replacing the inline structures that contain `any`.

**Proposed Code Snippets:**
```tsx
// Import required types from @stripe/stripe-js
import type { 
  StripeAddressElementChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent 
} from '@stripe/stripe-js';

// ...

// Replace `any` with explicit event typing
const onShippingRateChange = async (event: StripeExpressCheckoutElementShippingRateChangeEvent) => {
  try {
    const res = await fetch(`${API_BASE}/api/update-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Use explicitly passed paymentIntentId
        payment_intent_id: paymentIntentId, 
        selected_shipping_rate: event.shippingRate.identifier
      })
    });
    const data = await res.json();
    
    event.resolve({
      newTotal: {
        amount: data.amount,
        label: 'Total'
      }
    });
  } catch (e) {
    event.reject();
  }
};
```

## 3. UX / Routing Issue (Error Boundary "Go Back")
**Issue:** 
The error boundary provides a "Go Back" button that utilizes the native `window.history.back()`. React Router navigation should be used instead for a more robust and predictable SPA routing experience.

**Solution:**
Import `useNavigate` from `react-router-dom` and replace the native browser API call with React Router's navigation function `navigate(-1)`.

**Proposed Code Snippets:**
```tsx
import { useNavigate } from 'react-router-dom';

export default function CheckoutPage() {
  const navigate = useNavigate(); // Initialize useNavigate
  // ...

  if (error) {
    return (
      <div className="checkout-error-page">
        <h2>Checkout Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => navigate(-1)} // Use React Router's navigate
          className="go-back-btn"
        >
          Go Back
        </button>
      </div>
    );
  }
  // ...
}
```

## 4. Styling Anti-pattern (Heavy Inline Styles)
**Issue:** 
The component heavily relies on inline style objects rather than extracting layout and colors to CSS classes.

**Solution:**
Create a dedicated CSS file (e.g., `CheckoutPage.css`) and define CSS classes corresponding to the inline styles. Replace all `style={{...}}` blocks with proper `className` attributes.

**Proposed Code Snippets:**

*src/pages/CheckoutPage.css*
```css
.checkout-page-container {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
  background: white;
  color: black;
  border-radius: 8px;
}

.checkout-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.checkout-error-page {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
  background: white;
  color: black;
  border-radius: 8px;
  text-align: center;
}

.checkout-error-page h2 {
  color: #d32f2f;
  margin-bottom: 1rem;
}

.go-back-btn, .pay-now-btn {
  padding: 1rem;
  background: var(--accent, #007bff);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.pay-now-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.shipping-options-container {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
}

.shipping-rate-option {
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
```

*src/pages/CheckoutPage.tsx*
```tsx
import './CheckoutPage.css'; // Import the new stylesheet

// ...

return (
  <form onSubmit={handleSubmit} className="checkout-form">
    {/* ... */}
    
    {shippingRates.length > 0 && (
      <div className="shipping-options-container">
        <h3>Shipping Options</h3>
        {shippingRates.map(rate => (
          <div key={rate.id} className="shipping-rate-option">
            <label>
              <input 
                type="radio" 
                name="shippingRate" 
                value={rate.id} 
                checked={selectedRate === rate.id}
                onChange={() => handleRateSelection(rate.id)}
              />
              {rate.service} - ${rate.rate}
            </label>
          </div>
        ))}
      </div>
    )}

    {/* ... */}

    <button 
      type="submit" 
      disabled={!stripe || loading || !selectedRate}
      className="pay-now-btn"
    >
      {loading ? 'Processing...' : 'Pay Now'}
    </button>
  </form>
);
```
