import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe, type StripeElementsOptions, type StripeAddressElementChangeEvent, type StripeExpressCheckoutElementShippingAddressChangeEvent, type StripeExpressCheckoutElementShippingRateChangeEvent } from '@stripe/stripe-js';
import {
  Elements,
  ExpressCheckoutElement,
  AddressElement,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useStore } from '@/store/useStore';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');
const API_BASE = import.meta.env.VITE_API_URL || '';

type ShippingRate = {
  id: string;
  service: string;
  rateInCents: number;
};

interface CheckoutFormProps {
  clientSecret: string;
  paymentIntentId: string;
}

const CheckoutForm = ({ clientSecret, paymentIntentId }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const store = useStore();
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchShippingRates = async (zip: string, state?: string, country?: string) => {
    const res = await fetch(`${API_BASE}/api/calculate-shipping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zip,
        state,
        country: country || 'US',
        cart: store.cart,
        customBuilds: store.customBuilds,
        config: store.config,
      })
    });
    const data = await res.json();
    if (res.ok && data.shipmentId) {
      setShipmentId(data.shipmentId);
    }
    return data;
  };

  const updatePaymentIntent = async (rateId: string, shipId: string) => {
    const res = await fetch(`${API_BASE}/api/update-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_intent_id: paymentIntentId,
        shipment_id: shipId,
        rate_id: rateId,
      })
    });
    return res.json();
  };

  const onShippingAddressChange = async (event: StripeExpressCheckoutElementShippingAddressChangeEvent) => {
    const { address } = event;
    if (!address.postal_code) {
      event.resolve({ applePay: { shippingMethods: [] } }   as any);
      return;
    }

    try {
      const data = await fetchShippingRates(address.postal_code, address.state, address.country);

      const applePayRates = (data.rates || []).map((rate: ShippingRate) => ({
        label: rate.service,
        amount: rate.rateInCents,
        identifier: `${data.shipmentId}|${rate.id}`,
        detail: 'Standard shipping'
      }));

      event.resolve({
        applePay: { shippingMethods: applePayRates }
      }   as any);
    } catch {
      event.reject();
    }
  };

  const onShippingRateChange = async (event: StripeExpressCheckoutElementShippingRateChangeEvent) => {
    try {
      const [shipId, rateId] = (event.shippingRate   as any).identifier?.split('|') ?? [];
      if (!shipId || !rateId) {
        event.reject();
        return;
      }

      const data = await updatePaymentIntent(rateId, shipId);

      event.resolve({
        newTotal: {
          amount: data.amount,
          label: 'Total'
        }
      }   as any);
    } catch {
      event.reject();
    }
  };

  const handleAddressChange = async (event: StripeAddressElementChangeEvent) => {
    if (event.complete && event.value.address.postal_code) {
      try {
        const data = await fetchShippingRates(
          event.value.address.postal_code,
          event.value.address.state,
          event.value.address.country,
        );
        setShippingRates(data.rates || []);
        if (data.rates && data.rates.length > 0 && data.shipmentId) {
          handleRateSelection(data.rates[0].id, data.shipmentId);
        }
      } catch {
        console.error('Failed to fetch shipping rates');
      }
    }
  };

  const handleRateSelection = async (rateId: string, shipId?: string) => {
    setSelectedRate(rateId);
    const effectiveShipmentId = shipId || shipmentId;

    if (!effectiveShipmentId) {
      console.error('No shipment ID available for rate selection');
      return;
    }

    try {
      await updatePaymentIntent(rateId, effectiveShipmentId);
    } catch {
      console.error('Failed to update payment intent');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !selectedRate) return;

    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      }
    });

    if (error) {
      setErrorMessage(error.message || 'Payment failed');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="express-checkout">
        <ExpressCheckoutElement
          onShippingAddressChange={onShippingAddressChange}
          onShippingRateChange={onShippingRateChange}
          onConfirm={async () => {
            if (!stripe || !elements) return;
            const { error: submitError } = await elements.submit();
            if (submitError) {
              setErrorMessage(submitError.message || 'Error submitting');
              return;
            }
            const { error } = await stripe.confirmPayment({
              elements,
              clientSecret,
              confirmParams: {
                return_url: `${window.location.origin}/checkout/success`,
              },
            });
            if (error) {
              setErrorMessage(error.message || 'Payment failed');
            }
          }}
        />
      </div>

      <div className="separator" style={{ textAlign: 'center', margin: '1rem 0' }}>Or pay with card</div>

      <AddressElement
        options={{ mode: 'shipping' }}
        onChange={handleAddressChange}
      />

      {shippingRates.length > 0 && (
        <div className="shipping-options" style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>Shipping Options</h3>
          {shippingRates.map(rate => (
            <div key={rate.id} className="shipping-rate-option" style={{ margin: '0.5rem 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="shippingRate"
                  value={rate.id}
                  checked={selectedRate === rate.id}
                  onChange={() => handleRateSelection(rate.id)}
                />
                {rate.service} - ${(rate.rateInCents / 100).toFixed(2)}
              </label>
            </div>
          ))}
        </div>
      )}

      <div className="payment-element-wrapper">
        <PaymentElement />
      </div>

      {errorMessage && <div className="error-message" style={{ color: 'red' }}>{errorMessage}</div>}

      <button
        type="submit"
        disabled={!stripe || loading || !selectedRate}
        style={{ padding: '1rem', background: 'var(--accent, #007bff)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: (!stripe || loading || !selectedRate) ? 0.5 : 1 }}
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

export default function CheckoutPage() {
  const store = useStore();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntent = async () => {
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/create-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cart: store.cart,
            customBuilds: store.customBuilds
          })
        });

        const text = await res.text();
        let data;
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          console.error('Failed to parse response JSON:', text);
          setError(`Server error (${res.status}): The backend returned an invalid response.`);
          return;
        }

        if (!res.ok) {
          setError(data.error || `Failed to initialize checkout (Status: ${res.status})`);
          return;
        }

        setClientSecret(data.client_secret);
        setPaymentIntentId(data.id);
      } catch (e: unknown) {
        console.error('Failed to create payment intent', e);
        setError(e instanceof Error ? e.message : 'Network error occurred while trying to initialize checkout');
      }
    };
    fetchIntent();
  }, [store.cart, store.customBuilds]);

  if (error) {
    return (
      <div className="checkout-page" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', background: 'white', color: 'black', borderRadius: '8px', textAlign: 'center' }}>
        <h2 style={{ color: '#d32f2f', marginBottom: '1rem' }}>Checkout Error</h2>
        <p style={{ marginBottom: '2rem' }}>{error}</p>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '0.75rem 1.5rem', background: 'var(--accent, #007bff)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!clientSecret) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Checkout...</div>;

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: { theme: 'stripe' },
  };

  return (
    <div className="checkout-page" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', background: 'white', color: 'black', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Checkout</h2>
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm clientSecret={clientSecret} paymentIntentId={paymentIntentId} />
      </Elements>
    </div>
  );
}
