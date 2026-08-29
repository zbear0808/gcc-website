# Zu Builds

Modern e-commerce platform for custom GameCube Controllers (GCC).

## Architecture

This project has been rewritten as a Vite + React + TypeScript Single Page Application (SPA).
- **Frontend**: Vite, React, React Router v7, Zustand for state management.
- **Backend**: Vercel Serverless Functions (`api/` directory).
- **Database**: Upstash Redis (for inventory tracking).
- **Payments**: Stripe Payment Intents & Elements (custom checkout flow).
- **Shipping**: EasyPost (for real-time shipping rates).
- **Styling**: Vanilla CSS with custom properties and glassmorphism. No tailwind.

## Development

To run the full stack locally (Frontend + Vercel Serverless Functions) without proxy errors, the best way is to use the Vercel CLI, which manages both the frontend and backend for you. 

### 1. Start the Local Server

Run the single command using Vercel CLI:
```bash
vercel dev
```

`vercel dev` starts a unified local server on **`http://localhost:3000`** that automatically routes:
- **Frontend (Vite UI)**: `http://localhost:3000/` (and all SPA page routes)
- **Backend API (Serverless Functions)**: `http://localhost:3000/api/*`

> **Note:** Open your browser to **`http://localhost:3000`**. You only need `vercel dev` running in a single terminal. Do not run `npm run dev` separately.

### 2. Stripe Webhooks (Local Testing)

To test Stripe checkout and payments locally, you can use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks to your local backend server:

```bash
# Forward Stripe webhooks to your local Vercel server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
*Note: The Stripe CLI will output a webhook signing secret (starts with `whsec_`). Add this to your `.env` file as `STRIPE_WEBHOOK_SECRET`.*

### 3. Building for Production

```bash
# Build the React frontend for production
npm run build
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret
- `VITE_STRIPE_PUBLIC_KEY`: Your Stripe publishable key (starts with `pk_test_` or `pk_live_`)
- `EASYPOST_API_KEY`: Your EasyPost API key for shipping calculations
- `SHIPPING_ORIGIN_ZIP`: The origin zip code for calculating shipping rates
- `KV_REST_API_URL` & `KV_REST_API_TOKEN`: Your Upstash Redis credentials (provisioned via Vercel KV)
- `ADMIN_SECRET`: Secret token for the `/admin` inventory update endpoint
- `USE_FALLBACK_INVENTORY`: Set to `"true"` to use local fallback stock (10 per item) without needing Redis
- `VITE_API_URL`: (Production Render deployment only) URL of your Vercel deployment (leave blank for local dev or Vercel-only deployment)

### Pushing Environment Variables to Vercel

If you want to sync your local `.env` variables up to your Vercel project in bulk, you can run the provided utility script. It uses the Vercel CLI to programmatically upload every variable non-interactively.

```bash
# Push variables to the development environment
node scripts/push-env.js development

# Push variables to preview or production
node scripts/push-env.js preview
node scripts/push-env.js production
```
*Note: Make sure your Vercel CLI is linked to your project first (e.g. by running `vercel link`).*

## Deployment

The project is designed to be deployed with:
1. **Frontend**: Render (or any static host)
2. **Backend**: Vercel (zero-config, auto-deploys from the `api/` directory)

When deploying to Render, make sure to set the `VITE_API_URL` environment variable so the frontend knows where to send API requests. When deploying entirely to Vercel, this variable can be left empty as Vercel will handle the API routing automatically.
