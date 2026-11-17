import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { CheckIcon } from '@/components/Icons';

export default function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const status = params.get('redirect_status');
  const clearCart = useStore((state) => state.clearCart);
  const succeeded = status === 'succeeded' || status === 'processing';

  useEffect(() => {
    if (succeeded) clearCart();
  }, [succeeded, clearCart]);

  if (!succeeded) {
    return (
      <div className="page page-narrow checkout-result">
        <h1 className="page-title">Payment didn’t go through</h1>
        <p className="page-intro">You haven’t been charged. Your cart is still saved, so you can try again.</p>
        <Link to="/checkout" className="btn btn-go">
          Back to checkout
        </Link>
      </div>
    );
  }

  return (
    <div className="page page-narrow checkout-result">
      <span className="checkout-result-icon">
        <CheckIcon />
      </span>
      <h1 className="page-title">Thanks for your order!</h1>
      <p className="page-intro">
        Your order is in. Builds get tested before they ship, and everything goes out with USPS. If anything comes up, email me at{' '}
        <a href="mailto:contact@gcccontrollers.com">contact@gcccontrollers.com</a>.
      </p>
      <div className="checkout-result-actions">
        <Link to="/" className="btn btn-outline">
          Back to the shop
        </Link>
        <Link to="/faq#warranty" className="btn btn-ghost">
          Warranty info
        </Link>
      </div>
    </div>
  );
}
