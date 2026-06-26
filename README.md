# zubair laser website

**Live Site:** https://zulaser.onrender.com  
**Local Development:** http://localhost:5000

A ClojureScript React website for a custom GameCube controller shop, built with shadow-cljs and Helix. Includes a Node.js/Express backend for Stripe Checkout.

## Prerequisites

- **JDK 21+** — required by shadow-cljs to compile ClojureScript
- **Node.js 18+** and **npm**
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
```

You can find your test-mode secret key in the [Stripe Dashboard → API keys](https://dashboard.stripe.com/test/apikeys).

### 3. Start the frontend dev server

```bash
npm start
```

This runs `shadow-cljs watch app tests` and starts the frontend at **http://localhost:5000** with hot-reloading.

### 4. Start the Stripe backend server

In a **separate terminal**, compile and run the server:

```bash
# Compile the server build
npx shadow-cljs compile server

# Run the compiled server
node out/server.js
```

The backend starts on **http://localhost:3000**. It exposes a single endpoint:

- `POST /create-checkout-session` — accepts a JSON body with the controller configuration and returns a Stripe Checkout session URL.

> **Both processes need to be running** for checkout to work. The frontend on port 5000 makes requests to the backend on port 3000.

### Other commands

```bash
# Run tests in node with jsdom
npm test

# Build frontend for production
npm run build
```

## How Checkout Works

1. The user configures their controller on the shop page (shell, mods, etc.)
2. Clicking **"Build It"** sends the config as JSON to `POST http://localhost:3000/create-checkout-session`
3. The server (`src/server/core.cljs`) uses the shared pricing logic (`src/main/pricing.cljs`) to generate Stripe line items
4. Stripe creates a Checkout Session and returns a URL
5. The browser redirects to Stripe's hosted checkout page

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

### Docker (Optional)

Docker can be used as an alternative way to run or host the website locally or on other platforms:

```bash
# Build the Docker image
$ docker build -t zulaser-website .

# Run the container
$ docker run -p 8080:80 zulaser-website
```

The included `Dockerfile` uses JDK 21 to compile the ClojureScript code and serves the static output.

## Project Structure

- `src/main/` — Frontend ClojureScript source (React components, routing)
- `src/main/pages/shop.cljs` — Shop page with controller configurator and checkout
- `src/main/pricing.cljs` — Shared pricing logic (used by both frontend and server)
- `src/server/core.cljs` — Express backend for Stripe Checkout sessions
- `public/` — Static assets and compiled JavaScript output
- `shadow-cljs.edn` — Build configuration (defines `app`, `tests`, and `server` builds)
- `.github/workflows/` — GitHub Actions CI/CD pipeline
- `Dockerfile` — Docker build configuration (optional deployment method)
