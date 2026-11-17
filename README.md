# Zu Builds

Store site for my custom PhobGCC GameCube controllers: full builds, DIY kits and individual parts.

React + Vite on the front end, Vercel serverless functions in `api/`, Upstash Redis for inventory, Stripe for payments and EasyPost for shipping.

## Running locally

```bash
cp .env.example .env   # fill in keys
vercel dev             # site + API on http://localhost:3000
```

`npm run dev` only starts the front end, so API calls will fail. If you leave the Redis variables empty, local inventory falls back to 10 of everything.

To test payments, forward Stripe webhooks and put the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Other commands

```bash
npm test                           # vitest
npm run build                      # typecheck + production build
npx tsx seed-inventory.ts          # push starting inventory (needs ADMIN_SECRET)
node scripts/push-env.js production  # copy .env up to Vercel
```

## Env vars

See `.env.example`. The admin page and inventory updates need `ADMIN_SECRET`. Without it they return an error instead of letting anyone in. `VITE_API_URL` is only needed if the front end is hosted somewhere other than Vercel.
