# Resolution Plan: shipping.ts

## Issues to Resolve
- **Hardcoded Product References**: The `calculateParcel` function explicitly checks string literal product IDs instead of using a generalized flag like `isController`.
- **String Manipulation Hacks**: The logic aggressively strips `-worn` suffixes from item IDs, highlighting a discrepancy between generated inventory IDs and static catalog IDs.
- **Implicit Bulky Checks**: Items are flagged as bulky using magic threshold weight values instead of explicit `isBulky` boolean flags. Add configuration properties to the catalog rather than using hardcoded math logic.
