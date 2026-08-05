# Zu Builds

Modern e-commerce platform for custom GameCube Controllers (GCC).

## Architecture

This project has been rewritten as a Vite + React + TypeScript Single Page Application (SPA).
- **Frontend**: Vite, React, React Router v7, Zustand for state management.
- **Backend**: Vercel Serverless Functions (`api/` directory).
- **Database**: Upstash Redis (for inventory tracking).
- **Payments**: Stripe Checkout.
- **Styling**: Vanilla CSS with custom properties and glassmorphism. No tailwind.

## Development

To run the full stack locally (Frontend + Vercel Serverless Functions) without proxy errors, the best way is to use the Vercel CLI, which manages both the frontend and backend for you. 

### 1. Start the Local Server (Frontend + Backend)

You need the [Vercel CLI](https://vercel.com/docs/cli) installed to run the backend serverless functions locally alongside Vite.

```bash
# Install dependencies if you haven't already
npm install

# Install Vercel CLI globally (if you haven't already)
npm i -g vercel

# Start the dev server
vercel dev
```

`vercel dev` will automatically:
1. Start your Vercel Serverless Functions (the `api/` directory) on `http://localhost:3000`.
2. Start your Vite frontend development server in the background and serve it seamlessly at `http://localhost:3000`.

**Important Note:** 
- Open your browser to **`http://localhost:3000`** (NOT `http://localhost:5000`).
- You do **NOT** need to run `npm run dev` separately. `vercel dev` handles starting Vite for you. Running both at the same time is what causes port conflicts and `ECONNREFUSED` proxy errors.

### 3. Stripe Webhooks (Local Testing)

To test Stripe checkout and payments locally, you must use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks to your local backend server.

```bash
# Forward Stripe webhooks to your local Vercel server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
*Note: The Stripe CLI will output a webhook signing secret (starts with `whsec_`). Add this to your `.env` file as `STRIPE_WEBHOOK_SECRET`.*

### Building for Production

```bash
# Build the React frontend for production
npm run build
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret
- `VITE_STRIPE_PUBLIC_KEY`: Your Stripe publishable key (starts with pk_test_ or pk_live_)
- `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: Your Upstash Redis credentials
- `ADMIN_SECRET`: Secret token for the `/admin` inventory update endpoint
- `USE_FALLBACK_INVENTORY`: Set to "true" to skip Redis locally and mock inventory
- `VITE_API_URL`: (Production Render deployment only) URL of your Vercel deployment (e.g. `https://your-vercel-project.vercel.app`)

## Deployment

The project is designed to be deployed with:
1. **Frontend**: Render (or any static host)
2. **Backend**: Vercel (zero-config, auto-deploys from the `api/` directory)

When deploying to Render, make sure to set the `VITE_API_URL` environment variable so the frontend knows where to send API requests. When deploying entirely to Vercel, this variable can be left empty as Vercel will handle the API routing automatically.
