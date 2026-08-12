# Technical Debt Resolution Plan: ErrorBoundary.tsx

## Overview & Issue Description

The `ErrorBoundary.tsx` component ([src/components/ErrorBoundary.tsx](file:///c:/Users/zubair/Documents/GitHub/gcc-website/src/components/ErrorBoundary.tsx)) contains two key technical debt issues that harm maintainability, user experience, and architectural consistency:

1. **Aggressive Error Recovery (Full Page Reload)**:
   - **Current State**: The error fallback UI forces a full browser window refresh via `onClick={() => window.location.reload()}`.
   - **Impact**: Full page reloads destroy all in-memory React application state (such as unsaved user configurations, active wizard progress, or transient store data), initiate unnecessary network re-fetches, and deliver a jarring user experience.
   - **Resolution**: Implement localized error boundary state recovery (`this.handleReset`), allowing users to reset the error boundary state and re-render child components without losing global app state. Add support for an optional `onReset` prop callback and a dedicated retry mechanism, reserving page reloads as an optional secondary recourse.

2. **Inline Styles**:
   - **Current State**: The component markup uses hardcoded inline style objects:
     - `style={{ padding: '2rem', textAlign: 'center', color: 'red' }}`
     - `style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}`
   - **Impact**: Bypasses the central CSS design system, prevents dark/light theme adaptation via CSS custom properties (`var(...)`), makes responsive layout adjustments difficult, and violates codebase styling conventions.
   - **Resolution**: Extract all styles into a dedicated component stylesheet (`src/assets/styles/components/error-boundary.css`), leveraging existing CSS variables from `src/assets/styles/variables.css` and standard button styles from `src/assets/styles/components/buttons.css`.

---

## Technical Specifications & Code Changes

### 1. New Stylesheet: `src/assets/styles/components/error-boundary.css`

Create a clean, themed stylesheet using standard BEM-like class names and design system tokens.

```css
.error-boundary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1.5rem;
  margin: 2rem auto;
  max-width: 600px;
  background-color: var(--color-bg-secondary, #1a1a1a);
  border: 1px solid var(--color-border-danger, #ef4444);
  border-radius: var(--border-radius-md, 8px);
  text-align: center;
  color: var(--color-text-primary, #ffffff);
}

.error-boundary__title {
  margin-bottom: 0.75rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-danger, #ef4444);
}

.error-boundary__message {
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  color: var(--color-text-secondary, #a1a1aa);
  word-break: break-word;
}

.error-boundary__actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.error-boundary__btn {
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--border-radius-sm, 4px);
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.error-boundary__btn--primary {
  background-color: var(--color-button-primary-bg, #2563eb);
  color: var(--color-button-primary-text, #ffffff);
  border: none;
}

.error-boundary__btn--primary:hover {
  background-color: var(--color-button-primary-hover, #1d4ed8);
}

.error-boundary__btn--secondary {
  background-color: transparent;
  color: var(--color-text-secondary, #a1a1aa);
  border: 1px solid var(--color-border-subtle, #3f3f46);
}

.error-boundary__btn--secondary:hover {
  background-color: var(--color-bg-tertiary, #27272a);
  color: var(--color-text-primary, #ffffff);
}
```

### 2. Stylesheet Index Integration: `src/assets/styles/index.css`

Import the new component stylesheet in `src/assets/styles/index.css`:

```css
@import './components/error-boundary.css';
```

### 3. Refactored Component: `src/components/ErrorBoundary.tsx`

Extend `Props` to support lifecycle reset callbacks and fallback custom UI, while replacing inline styling with semantic CSS classes and soft state recovery.

```tsx
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  /** Optional custom fallback element to display instead of default UI */
  fallback?: ReactNode;
  /** Optional callback invoked when the user resets/retries from an error */
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: undefined });
  };

  private handleReloadPage = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary" role="alert">
          <h2 className="error-boundary__title">Oops, something went wrong</h2>
          <p className="error-boundary__message">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <div className="error-boundary__actions">
            <button
              type="button"
              onClick={this.handleReset}
              className="error-boundary__btn error-boundary__btn--primary"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={this.handleReloadPage}
              className="error-boundary__btn error-boundary__btn--secondary"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Step-by-Step Execution Plan

1. **Create Stylesheet**:
   - Add `src/assets/styles/components/error-boundary.css`.
   - Update `src/assets/styles/index.css` to import `@import './components/error-boundary.css';`.

2. **Update Component Implementation**:
   - Edit `src/components/ErrorBoundary.tsx` to add `handleReset`, state recovery logic, `onReset` and `fallback` props, and semantic CSS classes.

3. **Verification**:
   - Run type checking / linter (`npm run check` or `tsc --noEmit`).
   - Add/run unit tests for `ErrorBoundary.tsx` ensuring `Try Again` resets `hasError` state and re-mounts child components.
