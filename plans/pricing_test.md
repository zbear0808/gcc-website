# Resolution Plan: pricing.test.ts

## Issues to Resolve
- **Brittle, Data-Dependent Tests**: The tests currently depend heavily on live data in `catalog.ts` (e.g., asserting hardcoded totals like 122 or 213). Refactor these tests to use mocked catalog data to decouple pure-logic tests from specific price values.
