# Resolution Plan: create-payment-intent.ts

## Issues to Resolve
- **Broken Fallback Logic**: Fix the `!redis` strict check that crashes the endpoint and properly implement the fallback mode.
- **Type Safety Bypass**: Remove `as any` for the Stripe API version and rely on proper types.
- **Excessive TTL for Cart Cache**: Lower the Redis TTL from 7 days to a more sensible duration (e.g., 30m-1h) to prevent inventory locks and stale prices.
