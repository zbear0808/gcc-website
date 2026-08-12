# Resolution Plan: CheckoutPage.tsx

## Issues to Resolve
- **Fragile Logic / Bug**: Stop extracting the Payment Intent ID by splitting the `clientSecret` string. Update the backend to explicitly return the `paymentIntentId` along with the secret, and use that value directly.
- **TypeScript Issue**: Replace `any` types in Stripe Elements callbacks with the proper event types provided by `@stripe/stripe-js` (e.g., `StripeCardElementChangeEvent`).
- **UX / Routing Issue**: Replace `window.history.back()` in the error boundary with React Router's `useNavigate` for robust client-side navigation.
- **Styling Anti-pattern**: Refactor heavy inline style objects to use CSS classes defined in a stylesheet.
