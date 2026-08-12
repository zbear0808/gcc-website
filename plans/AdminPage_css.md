# Resolution Plan: Refactoring `AdminPage.css` to CSS Design Tokens

## Executive Summary
`src/pages/AdminPage.css` heavily relies on hardcoded hex colors (`#111`, `#333`, `#222`, `#444`, `#4ade80`, `#22c55e`, `#ef4444`, `#555`, `#1a1a1a`, `#aaa`, `#3b82f6`, `#2563eb`, `#60a5fa`) instead of utilizing standardized CSS variables defined in `src/assets/styles/variables.css`. Additionally, `src/pages/AdminPage.tsx` contains inline style objects with duplicate hardcoded hex values.

This plan details the migration of hardcoded hex values to design tokens, addition of missing color tokens to `variables.css`, and cleanup of inline styles in `AdminPage.tsx` for optimal architectural maintainability.

---

## 1. Audit of Hardcoded Colors

### 1.1 In `src/pages/AdminPage.css`
| Line Range | Selector / Element | Hardcoded Hex | Proposed CSS Variable |
|---|---|---|---|
| 5 | `.admin-login-container` | `background: #111` | `var(--color-bg-card)` |
| 7 | `.admin-login-container` | `border: 1px solid #333` | `var(--color-border)` |
| 20 | `.admin-login-container input` | `background: #222` | `var(--color-bg-input)` |
| 21 | `.admin-login-container input` | `border: 1px solid #444` | `var(--color-border-input)` |
| 28 | `.admin-login-container button` | `background: #4ade80` | `var(--color-accent-green)` |
| 37 | `.admin-login-container button:hover` | `background: #22c55e` | `var(--color-success)` |
| 41 | `.admin-login-container .error` | `color: #ef4444` | `var(--color-error)` |
| 60 | `.refresh-btn` | `background: #333` | `var(--color-bg-button-muted)` |
| 62 | `.refresh-btn` | `border: 1px solid #555` | `var(--color-border-subtle)` |
| 68 | `.refresh-btn:hover` | `background: #444` | `var(--color-bg-button-muted-hover)` |
| 75 | `.admin-table` | `background: #111` | `var(--color-bg-card)` |
| 83 | `.admin-table th, td` | `border-bottom: 1px solid #222` | `var(--color-border-subtle)` |
| 87 | `.admin-table th` | `background: #1a1a1a` | `var(--color-bg-form)` |
| 88 | `.admin-table th` | `color: #aaa` | `var(--color-text-muted)` |
| 93 | `.admin-table tbody tr:hover` | `background: #1a1a1a` | `var(--color-bg-form)` |
| 98 | `.admin-table button` | `background: #3b82f6` | `var(--color-primary)` |
| 106 | `.admin-table button:hover` | `background: #2563eb` | `var(--color-primary-hover)` |
| 110 | `.admin-table button:disabled` | `background: #444` | `var(--color-bg-disabled)` |
| 115 | `.admin-table a` | `color: #60a5fa` | `var(--color-link)` |

### 1.2 Inline Styles in `src/pages/AdminPage.tsx`
- **Line 143 (Inventory Input)**: `background: '#222', color: 'white', border: '1px solid #444'` -> Replace inline style with CSS class `.admin-input` or style via `AdminPage.css`.
- **Line 150 (Save Inventory Button)**: `background: '#4ade80', color: 'black'` -> Replace inline style with CSS class `.admin-submit-btn` in `AdminPage.css`.

---

## 2. Design Token Expansion (`variables.css`)

Ensure `src/assets/styles/variables.css` contains all necessary semantic tokens:

```css
:root {
  /* Color Palette Additions */
  --color-accent-green: #4ade80;
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-link: #60a5fa;
  --color-text-muted: #aaaaaa;
  --color-border-subtle: #222222;
  --color-border-muted: #555555;
  --color-bg-button-muted: #333333;
  --color-bg-button-muted-hover: #444444;
  --color-bg-disabled: #444444;
}
```

---

## 3. Implementation Steps

### Phase 1: Update `src/assets/styles/variables.css`
1. Add missing color design tokens for primary accents (`#3b82f6`, `#2563eb`, `#60a5fa`, `#4ade80`) and subtle neutral shades (`#aaa`, `#555`, `#222`).

### Phase 2: Refactor `src/pages/AdminPage.css`
1. Replace all hardcoded hex values with their corresponding `var(...)` definitions.
2. Add classes for table inputs (`.admin-table-input`) and action buttons (`.admin-save-btn`) to eliminate inline styles in JSX.

### Phase 3: Clean up `src/pages/AdminPage.tsx`
1. Remove inline `style={{ ... }}` props on elements and replace with semantic class names (`admin-table-input`, `admin-save-btn`).

---

## 4. Verification & Testing

1. **Visual Regression Check**: Ensure Admin Login container, table headers, hover states, buttons, and links retain identical visual presentation.
2. **Theme Maintenance Check**: Verify that changing a token in `variables.css` (e.g., `--color-primary` or `--color-bg-card`) correctly propagates throughout the Admin page.
3. **Build & Lint Verification**: Execute project build (`npm run build` or `vite build`) to confirm no CSS compilation errors occur.
