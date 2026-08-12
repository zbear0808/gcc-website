# ControllerVisualizer.tsx Refactoring Plan

## Executive Summary
`ControllerVisualizer.tsx` renders an interactive visual representation of custom controller configurations (or PCB layouts for DIY kits). The component currently suffers from **Tight Data Coupling** (hardcoded product and cable ID strings embedded directly in rendering logic) and **Risky Dynamic CSS / Class Interpolation** (direct string interpolation of configuration state into CSS variables and class names without sanitization or mapping).

This plan outlines the concrete steps to decouple catalog identifiers from UI logic and sanitize dynamic CSS variable/class generation.

---

## 1. Issue: Tight Data Coupling (Hardcoded Product & Cable IDs)

### Problem Analysis
`ControllerVisualizer.tsx` checks hardcoded string literals directly within component evaluation:
- **Product ID checks (Line 29):**
  ```typescript
  const isDIY = config.product === 'diy-kit' || config.product === '0-solder-diy-kit';
  ```
- **Cable ID checks & Inline Logic (Lines 22–27):**
  ```typescript
  if (config.cable === 'cable-3rd-party-3m') {
    plugColor = 'var(--shell-indigo)';
  } else if (config.cable === 'cable-paracord-3m') {
    plugColor = '#222'; // black
    isParacord = true;
  }
  ```

**Risks:**
- Changes to catalog product IDs in backend or store schema will break visualizer logic silently.
- Business rules regarding product classification (DIY kits vs full builds) and cable properties are duplicated across components instead of centralized.

### Solution
1. **Centralize Domain Helpers & Predicates:**
   Create or update domain helpers in `@/constants/products` or `@/utils/controllerVisualizerUtils.ts` to export semantic predicates and configuration mappings:
   - `isDiyKitProduct(productId?: string): boolean`
   - `getCableProperties(cableId?: string): { plugColor: string; isParacord: boolean }`

2. **Refactor Component:**
   Replace raw string comparisons in `ControllerVisualizer.tsx` with these semantic helper functions.

### Proposed Implementation Code Snippet

*In `@/utils/controllerVisualizerUtils.ts` (or `@/constants/products.ts`):*
```typescript
export const DIY_PRODUCT_IDS = new Set(['diy-kit', '0-solder-diy-kit']);

export const CABLE_CONFIG_MAP: Record<string, { plugColor: string; isParacord: boolean }> = {
  'cable-3rd-party-3m': {
    plugColor: 'var(--shell-indigo)',
    isParacord: false,
  },
  'cable-paracord-3m': {
    plugColor: '#222',
    isParacord: true,
  },
};

export function isDiyKit(productId?: string): boolean {
  return Boolean(productId && DIY_PRODUCT_IDS.has(productId));
}

export function getCableDetails(cableId?: string, defaultShellColor = 'var(--shell-oem)') {
  if (!cableId || !CABLE_CONFIG_MAP[cableId]) {
    return { plugColor: defaultShellColor, isParacord: false };
  }
  return CABLE_CONFIG_MAP[cableId];
}
```

*In `ControllerVisualizer.tsx`:*
```tsx
const isDIY = isDiyKit(config.product);
const { plugColor, isParacord } = getCableDetails(config.cable, shellColor);
```

---

## 2. Issue: Risky Dynamic CSS / Class Name Interpolation

### Problem Analysis
The component interpolates configuration values directly into CSS variable names and class names without validation or sanitization:
- **Direct CSS Variable Interpolation (Line 7):**
  ```typescript
  const shellColor = `var(--shell-${config.shell || 'oem'})`;
  ```
  *Risk:* If `config.shell` contains arbitrary user input, unexpected symbols, or malicious characters, it can corrupt style attributes or create CSS injection vulnerabilities.

- **Unsanitized Class Name Interpolations (Lines 33 & 119):**
  ```typescript
  <div className={`controller-map ${config.buttons ? `theme-${config.buttons}` : ''}`}>
  ```
  ```typescript
  <div className={`stick stick-left ${hasFirefox ? 'has-firefox' : ''} ${hasWavedash ? 'has-wavedash' : ''} notch-style-${config.notchStyle || 'deep'}`}>
  ```
  *Risk:* String interpolation directly concatenates values like `config.buttons` and `config.notchStyle` into HTML class attributes without validating if they match expected identifiers.

### Solution
1. **Whitelist & Map Valid CSS Options:**
   Define explicit allowed sets/mappings for shells, button themes, and notch styles:
   - `ALLOWED_SHELL_COLORS`: Map or whitelist valid shell keys to CSS variable tokens (`var(--shell-<key>)`).
   - `ALLOWED_BUTTON_THEMES`: Whitelist valid button theme names.
   - `ALLOWED_NOTCH_STYLES`: Whitelist valid notch styles (`deep`, `subtle`, etc.).

2. **Sanitization Functions:**
   Create safe accessor functions that sanitize state values before producing CSS variables or class names, returning safe defaults when values fall outside the expected enum/whitelist.

### Proposed Implementation Code Snippet

*In `@/utils/controllerVisualizerUtils.ts`:*
```typescript
const VALID_SHELLS = new Set(['oem', 'indigo', 'black', 'spice', 'emerald', 'clear']);
const VALID_BUTTON_THEMES = new Set(['oem', 'c-stick', 'blackout', 'pastel', 'custom']);
const VALID_NOTCH_STYLES = new Set(['deep', 'subtle', 'hybrid']);

export function getSafeShellColor(shell?: string): string {
  const safeShell = shell && VALID_SHELLS.has(shell) ? shell : 'oem';
  return `var(--shell-${safeShell})`;
}

export function getSafeButtonThemeClass(buttons?: string): string {
  if (!buttons || !VALID_BUTTON_THEMES.has(buttons)) return '';
  return `theme-${buttons}`;
}

export function getSafeNotchStyleClass(notchStyle?: string): string {
  const safeStyle = notchStyle && VALID_NOTCH_STYLES.has(notchStyle) ? notchStyle : 'deep';
  return `notch-style-${safeStyle}`;
}
```

*In `ControllerVisualizer.tsx`:*
```tsx
const shellColor = getSafeShellColor(config.shell);
const buttonThemeClass = getSafeButtonThemeClass(config.buttons);
const notchStyleClass = getSafeNotchStyleClass(config.notchStyle);

// Usage in JSX:
<div className={`controller-map ${buttonThemeClass}`}>
  ...
  <div className={`stick stick-left ${hasFirefox ? 'has-firefox' : ''} ${hasWavedash ? 'has-wavedash' : ''} ${notchStyleClass}`}>
```

---

## 3. Implementation Steps & Verification Plan

### Execution Checklist
1. **Create Utility File:**
   - Create `src/utils/controllerVisualizerUtils.ts` containing the whitelist constants, safe CSS extractors, and domain predicates.
2. **Refactor `ControllerVisualizer.tsx`:**
   - Import utilities into `ControllerVisualizer.tsx`.
   - Remove hardcoded ID string comparisons (`'cable-3rd-party-3m'`, `'diy-kit'`, etc.).
   - Replace dynamic string interpolations (`var(--shell-...)`, `theme-...`, `notch-style-...`) with safe helper calls.
3. **Automated Testing:**
   - Add unit tests in `src/utils/controllerVisualizerUtils.test.ts` to test edge cases (undefined config values, invalid/malicious string inputs, valid product IDs).
   - Verify `ControllerVisualizer` renders expected markup and styles under various store state configurations.
