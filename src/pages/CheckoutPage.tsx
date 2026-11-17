import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { loadStripe, type StripeElementsOptions, type StripeAddressElementChangeEvent, type StripeExpressCheckoutElementShippingAddressChangeEvent, type StripeExpressCheckoutElementShippingRateChangeEvent } from '@stripe/stripe-js';
import {
  Elements,
  ExpressCheckoutElement,
  AddressElement,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useStore, useCartTotal } from '@/store/useStore';
import { fullCatalog } from '@shared/catalog';
import { calculateTotal, formatPrice, getItem } from '@shared/pricing';

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
      event.resolve({ applePay: { shippingMethods: [] } } as any);
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
      } as any);
    } catch (e) {
      event.reject();
    }
  };

  const onShippingRateChange = async (event: StripeExpressCheckoutElementShippingRateChangeEvent) => {
    try {
      const [shipId, rateId] = (event.shippingRate as any).identifier?.split('|') ?? [];
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
      } as any);
    } catch (e) {
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
      } catch (e) {
        console.error('Failed to fetch shipping rates:', e);
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
    } catch (e) {
      console.error('Failed to update payment intent:', e);
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
    <form onSubmit={handleSubmit} className="checkout-form">
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

      <div className="checkout-separator"><span>or pay with card</span></div>

      <h2 className="checkout-step">Shipping address</h2>

      <AddressElement
        options={{ mode: 'shipping' }}
        onChange={handleAddressChange}
      />

      {shippingRates.length > 0 && (
        <fieldset className="shipping-options">
          <legend className="checkout-step">Shipping method</legend>
          {shippingRates.map(rate => (
            <label key={rate.id} className={`shipping-rate-option ${selectedRate === rate.id ? 'active' : ''}`}>
              <input
                type="radio"
                name="shippingRate"
                value={rate.id}
                checked={selectedRate === rate.id}
                onChange={() => handleRateSelection(rate.id)}
              />
              <span>{rate.service}</span>
              <span className="shipping-rate-price">${(rate.rateInCents / 100).toFixed(2)}</span>
            </label>
          ))}
        </fieldset>
      )}

      <h2 className="checkout-step">Payment</h2>
      <div className="payment-element-wrapper">
        <PaymentElement />
      </div>

      {errorMessage && <div className="checkout-error" role="alert">{errorMessage}</div>}

      <button type="submit" className="btn btn-go btn-lg btn-block" disabled={!stripe || loading || !selectedRate}>
        {loading ? 'Processing…' : 'Pay now'}
      </button>
      {!selectedRate && <p className="checkout-hint">Enter your address to see shipping options.</p>}
    </form>
  );
};

export default function CheckoutPage() {
  const store = useStore();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isEmpty = Object.values(store.cart).every((qty) => qty <= 0) && store.customBuilds.length === 0;

  useEffect(() => {
    if (isEmpty) return;
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
        } catch (parseError) {
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
  }, [store.cart, store.customBuilds, isEmpty]);

  if (isEmpty) return <Navigate to="/cart" replace />;

  if (error) {
    return (
      <div className="page page-narrow checkout-result">
        <h1 className="page-title">Checkout isn’t working right now</h1>
        <p className="page-intro">{error}</p>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="page page-narrow checkout-loading" aria-busy="true">
        Loading checkout…
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#9a8cf0',
        colorBackground: '#1b1924',
        colorText: '#f1eff6',
        colorTextSecondary: '#a29db3',
        colorDanger: '#e0605e',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        borderRadius: '3px',
      },
      rules: {
        '.Input': { border: '1px solid #403b52', boxShadow: 'none' },
        '.Input:focus': { border: '1px solid #9a8cf0', boxShadow: '0 0 0 1px #9a8cf0' },
      },
    },
  };

  return (
    <div className="page checkout-page">
      <h1 className="page-title">Checkout</h1>
      <div className="checkout-layout">
        <div className="checkout-main">
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm clientSecret={clientSecret} paymentIntentId={paymentIntentId} />
          </Elements>
        </div>
        <OrderSummary />
      </div>
    </div>
  );
}

function OrderSummary() {
  const cart = useStore((state) => state.cart);
  const customBuilds = useStore((state) => state.customBuilds);
  const subtotal = useCartTotal();
  const parts = fullCatalog.flatMap((c) => c.subtypes);

  const lines = [
    ...customBuilds.map((build, idx) => ({
      key: `build-${idx}`,
      label: getItem(build.product ?? '')?.label ?? 'Custom build',
      qty: 1,
      price: calculateTotal(build),
    })),
    ...Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = parts.find((p) => p.id === id);
        return { key: id, label: item?.label ?? id, qty, price: (item?.individualPrice ?? item?.price ?? 0) * qty };
      }),
  ];

  return (
    <aside className="checkout-summary">
      <div className="checkout-summary-header">
        <h2>Order</h2>
        <Link to="/cart">Edit</Link>
      </div>
      <ul>
        {lines.map((line) => (
          <li key={line.key}>
            <span>
              {line.label}
              {line.qty > 1 && <span className="checkout-qty"> × {line.qty}</span>}
            </span>
            <span>${formatPrice(line.price)}</span>
          </li>
        ))}
      </ul>
      <div className="checkout-summary-total">
        <span>Subtotal</span>
        <span>${formatPrice(subtotal)}</span>
      </div>
      <p className="checkout-summary-note">Shipping is added once you pick a method.</p>
    </aside>
  );
}
