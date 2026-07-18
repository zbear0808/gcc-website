# zubair laser website

**Live Site:** https://zulaser.onrender.com  
**Local Development:** http://localhost:5000

A ClojureScript React website for a custom GameCube controller shop, built with shadow-cljs and Helix. Includes a Vercel serverless backend for Stripe Checkout and inventory management.

## Prerequisites

- **JDK 21+** — required by shadow-cljs to compile ClojureScript
- **Node.js 18+** and **npm**
- **Vercel CLI** — for local backend development (install with `npm i -g vercel`)
- A **Stripe account** with API keys (for checkout functionality)

## Local Development

### 1. Install dependencies

```bash
npm ci
```

### 2. Set up environment variables

Create a `.env` file in the project root (it is already gitignored):

```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# For inventory management, either use the fallback or provide Upstash Redis credentials:
USE_FALLBACK_INVENTORY=true
# KV_REST_API_URL=your_upstash_url
# KV_REST_API_TOKEN=your_upstash_token
```

You can find your test-mode secret key in the [Stripe Dashboard → API keys](https://dashboard.stripe.com/test/apikeys).

### 3. Start the frontend dev server

```bash
npm start
```

This runs `shadow-cljs watch app tests` and starts the frontend at **http://localhost:5000** with hot-reloading.

### 4. Start the backend server (Vercel Dev)

In a **separate terminal**, compile the server and start Vercel Dev:

```bash
# Compile the server build (outputs to api/index.js)
npx shadow-cljs compile server

# Run Vercel local dev environment
vercel dev
```

Vercel Dev will start on **http://localhost:3000** and handle routing `/api/*` to the serverless function. 

The backend exposes several endpoints:
- `POST /api/checkout` — accepts a JSON body with the controller configuration and returns a Stripe Checkout session URL.
- `GET /api/inventory` — fetches current inventory.
- `POST /api/inventory` — updates inventory manually.
- `POST /api/webhooks/stripe` — handles post-checkout logic (decrementing inventory).

> **Both processes need to be running** for local checkout to work. The frontend on port 5000 makes requests to the Vercel dev server on port 3000.

### Other commands

```bash
# Run tests in node with jsdom
npm test

# Build frontend for production
npm run build
```

## How Checkout Works

1. The user configures their controller on the shop page (shell, mods, etc.)
2. Clicking **"Build It"** sends the config as JSON to `POST /api/checkout`
3. The server (`src/server/core.cljs`) uses the shared pricing logic (`src/main/pricing.cljs`) to generate Stripe line items
4. Stripe creates a Checkout Session and returns a URL
5. The browser redirects to Stripe's hosted checkout page
6. On success, Stripe hits the webhook (`POST /api/webhooks/stripe`) which updates the inventory.

## Deployment

This project uses an automated deployment pipeline:

### Current Deployment Workflow

1. **GitHub Actions** - Builds the site on every push to `main`
   - Compiles ClojureScript code with shadow-cljs (requires JDK 21+)
   - Pushes compiled output to [zulaser-deploy](https://github.com/zbear0808/zulaser-deploy)

2. **Render.com** - Automatically deploys when `zulaser-deploy` receives new commits
   - Watches the [zulaser-deploy](https://github.com/zbear0808/zulaser-deploy) repository
   - Serves the static files from the `public/` directory

The GitHub Actions workflow (`.github/workflows/main.yml`) handles the build process, and the compiled site is pushed to the deployment repository for Render to pick up.

## Project Structure

- `src/main/` — Frontend ClojureScript source (React components, routing)
- `src/main/pages/shop.cljs` — Shop page with controller configurator and checkout
- `src/main/pricing.cljs` — Shared pricing logic (used by both frontend and server)
- `src/server/core.cljs` — Serverless backend for Stripe Checkout sessions and inventory
- `public/` — Static assets and compiled JavaScript output
- `shadow-cljs.edn` — Build configuration (defines `app`, `tests`, and `server` builds)
- `.github/workflows/` — GitHub Actions CI/CD pipeline
- `api/` — Compiled backend serverless function (created during build)
