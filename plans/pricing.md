# Plan: Resolve Technical Debt in `shared/pricing.ts`

This plan details the steps required to resolve architectural issues, magic number duplications, logic duplications, and a state mutation anti-pattern in [`shared/pricing.ts`](file:///c:/Users/zubair/Documents/GitHub/gcc-website/shared/pricing.ts).

---

## 1. Mutation Anti-Pattern
**Issue:**
In `sanitizeConfig` (lines 84–86 of `shared/pricing.ts`), `result.wornShell` is mutated directly in place:
```typescript
if (result.wornShell && !['indigo', 'black', 'platinum'].includes(result.shell ?? '')) {
  result.wornShell = false;
}
```
Even though `result` was created via object spreading (`let result = { ...config }`), directly mutating object properties violates functional immutability practices and introduces subtle side-effect risks.

**Resolution:**
Replace direct property mutation with functional immutable updates:
```typescript
if (result.wornShell && !WORN_SHELL_ELIGIBLE_SHELLS.has(result.shell ?? '')) {
  result = { ...result, wornShell: false };
}
```

---

## 2. Duplicated Magic Numbers & Strings
**Issue:**
Magic numbers and hardcoded item identifiers are scattered across multiple functions (`sanitizeConfig`, `calculateTotal`, `getLineItems`):
- Worn shell discount (`-4` vs `4`) is hardcoded independently in `calculateTotal` and `getLineItems`.
- Subtle notches premium (`15`) is hardcoded in both `calculateTotal` and `getLineItems`.
- Kailh Choco switch premiums (`40` for both sides, `30` for single side) are duplicated in `calculateTotal` and `getLineItems`.
- Default item fallback IDs (`'indigo'`, `'oem-buttons'`, `'cable-paracord-3m'`, `'slider-pot-alps'`, `'tactile-z'`, `'membrane-extremerate'`, `'gc-cap-okay'`, `'deep'`) are written inline in `sanitizeConfig`.
- Eligible worn shell color names (`['indigo', 'black', 'platinum']`) are hardcoded inline in `sanitizeConfig`.

**Resolution:**
Extract all pricing adjustments, default item IDs, and eligible categories into centralized exportable constants:

```typescript
export const PRICING_CONSTANTS = {
  WORN_SHELL_DISCOUNT: 4,
  SUBTLE_NOTCH_PREMIUM: 15,
  KAILH_CHOCO_BOTH_SIDES_PREMIUM: 40,
  KAILH_CHOCO_SINGLE_SIDE_PREMIUM: 30,
} as const;

export const WORN_SHELL_ELIGIBLE_SHELLS = new Set(['indigo', 'black', 'platinum']);

export const FULL_BUILD_DEFAULTS: Partial<ConfiguratorState> = {
  shell: 'indigo',
  buttons: 'oem-buttons',
  rumble: 'rumble-oem',
  cable: 'cable-paracord-3m',
  sliderPots: 'slider-pot-alps',
  zButton: 'tactile-z',
  membrane: 'membrane-extremerate',
  stickCap: 'gc-cap-okay',
  notchStyle: 'deep',
};

export const DIY_KIT_DEFAULTS: Partial<ConfiguratorState> = {
  cable: 'cable-paracord-3m',
  sliderPots: 'slider-pot-alps',
  zButton: 'tactile-z',
  membrane: 'membrane-extremerate',
  stickCap: 'gc-cap-okay',
};
```

---

## 3. Architectural Issue (Widespread Logic Duplication)
**Issue:**
There is extensive duplication of configuration component iteration and dynamic price adjustment logic:
1. **Component Key Selection:**
   - Full builds check: `buttons`, `rumble`, `cable`, `sliderPots`, `zButton`, `membrane`, `stickCap`.
   - DIY kits check: `cable`, `sliderPots`, `zButton`, `membrane`, `stickCap`.
   - The same arrays of keys are hardcoded separately in `calculateTotal`, `getLineItems`, and `getAllItemsFromConfig`.
2. **Price Adjustments:**
   - `calculateTotal` and `getLineItems` duplicate identical boolean condition checks and calculations for `wornShell` discount, `subtleNotches` premium, and `kailhChoco` premiums.

**Resolution:**
Extract shared helper functions to encapsulate component retrieval and dynamic price adjustments:

```typescript
/**
 * Returns the relevant configurable component keys for a given product configuration.
 */
export function getComponentKeysForBuild(config: ConfiguratorState): (keyof ConfiguratorState)[] {
  if (isFullBuild(config)) {
    return ['buttons', 'rumble', 'cable', 'sliderPots', 'zButton', 'membrane', 'stickCap'];
  }
  if (isDiyKit(config)) {
    return ['cable', 'sliderPots', 'zButton', 'membrane', 'stickCap'];
  }
  return [];
}

/**
 * Returns dynamic adjustments (discounts and premiums) for a configuration.
 */
export interface DynamicAdjustment {
  id: string;
  label: string;
  amount: number;
}

export function getDynamicAdjustments(config: ConfiguratorState): DynamicAdjustment[] {
  const adjustments: DynamicAdjustment[] = [];

  if (isFullBuild(config)) {
    if (config.wornShell) {
      adjustments.push({
        id: 'worn-shell-discount',
        label: 'Worn Shell Discount',
        amount: -PRICING_CONSTANTS.WORN_SHELL_DISCOUNT,
      });
    }

    if (config.notchStyle === 'subtle' && (config.notchesFirefox || config.notchesWavedash)) {
      adjustments.push({
        id: 'subtle-notches-premium',
        label: 'Subtle Notches Premium',
        amount: PRICING_CONSTANTS.SUBTLE_NOTCH_PREMIUM,
      });
    }
  }

  return adjustments;
}
```

Refactor `calculateTotal` and `getLineItems` to use these central helpers so that price adjustments and component keys are computed from a single source of truth.

---

## 4. Architectural Issue (Hardcoded State vs Data-Driven Architecture)
**Issue:**
The relationships between product types (`full-build`, `diy-kit`), component lists, add-on pricing rules (e.g. `kailhChoco`), and defaults are hardcoded imperatively. Any addition of a new component type or modifier requires editing multiple nested function bodies in `pricing.ts`.

**Resolution:**
Refactor `pricing.ts` to be data-driven:
1. **Data-Driven Defaults:** Use `FULL_BUILD_DEFAULTS` and `DIY_KIT_DEFAULTS` to dynamically apply default selections in `sanitizeConfig`.
2. **Addon Pricing Rules Engine:** Use helper functions (e.g., `getAddonPrice(addon, config)`) to determine custom addon prices rather than inlining conditional logic inside `calculateTotal` and `getLineItems`.
3. **Declarative Line Items:** Compute Stripe line items by iterating over the result of `getComponentKeysForBuild(sanitized)` and `getDynamicAdjustments(sanitized)`, standardizing line item generation.

---

## Plan Execution & Verification Strategy

1. **Step 1: Constants & Types:** Add `PRICING_CONSTANTS`, `WORN_SHELL_ELIGIBLE_SHELLS`, `FULL_BUILD_DEFAULTS`, `DIY_KIT_DEFAULTS`, and `DynamicAdjustment`.
2. **Step 2: Refactor `sanitizeConfig`:** Update to use immutable object spread operations and default configuration objects.
3. **Step 3: Implement Shared Helpers:** Add `getComponentKeysForBuild`, `getDynamicAdjustments`, and `getAddonPrice`.
4. **Step 4: Refactor `calculateTotal`, `getLineItems`, and `getAllItemsFromConfig`:** Update to utilize shared helpers.
5. **Step 5: Verification:** Execute unit tests with `npx vitest run shared/pricing.test.ts` to confirm 100% test pass rate with zero regression.
