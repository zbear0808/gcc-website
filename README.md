# zubair laser website

**Live Site:** https://zulaser.onrender.com  
**Local Development:** http://localhost:5000

A ClojureScript React website built with shadow-cljs

## Local Development

```bash
# Install dependencies
$ npm ci

# Starts development server with hot reload
$ npm start

# Run tests in node with jsdom
$ npm test

# Build for production
$ npm run build
```

The development server will start at `http://localhost:5000` with hot-reloading enabled.

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

- `src/main/` - ClojureScript source files
- `public/` - Static assets and compiled JavaScript output
- `shadow-cljs.edn` - Build configuration
- `.github/workflows/` - GitHub Actions CI/CD pipeline
- `Dockerfile` - Docker build configuration (optional deployment method)
