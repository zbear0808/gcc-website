# Plan: Resolve Missing Edge Cases in `shared/order-logic.test.ts`

This plan outlines the testing strategy to resolve missing edge cases in `shared/order-logic.test.ts` for the pure order logic helper functions (`validateInventory` and `calculateStripeAmount`).

## 1. Overview & Context
The current test suite `shared/order-logic.test.ts` covers basic happy path scenarios:
- `validateInventory`: standard in-stock items and basic out-of-stock items missing or short in inventory.
- `calculateStripeAmount`: basic line item list accumulation and empty line items array.

However, several edge cases are missing tests to ensure robust inventory validation and billing calculations.

---

## 2. Missing Edge Cases for `validateInventory`

### Scenarios to Test
1. **Zero or Negative Requested Quantities:**
   - Requesting `0` or negative quantities (e.g., `{ 'item-a': 0, 'item-b': -1 }`) when stock is `0` or positive.
   - **Expected behavior:** Items with `qty <= 0` should not be flagged as out-of-stock.
2. **Explicit Zero Inventory:**
   - Item exists in inventory map with value `0` (e.g., `{ 'item-a': 0 }`) and `1` is requested.
   - **Expected behavior:** Item is correctly flagged in `outOfStock`.
3. **Empty Inventory Object:**
   - `currentInventory` is completely empty `{}` while items are requested.
   - **Expected behavior:** All requested items are returned as out-of-stock.
4. **Empty Requested Items Object:**
   - `requestedItems` is empty `{}`.
   - **Expected behavior:** Returns an empty array `[]`.
5. **Exact Match of Requested vs Available Stock:**
   - Requested quantity equals available quantity.
   - **Expected behavior:** Returns `[]` (all items in stock).

### Proposed Test Additions
```typescript
describe('validateInventory - Edge Cases', () => {
  it('handles zero or negative requested quantities without flagging out of stock', () => {
    const requestedItems = { 'item-a': 0, 'item-b': -2 };
    const currentInventory = { 'item-a': 0, 'item-b': 0 };
    const outOfStock = validateInventory(requestedItems, currentInventory);
    expect(outOfStock).toEqual([]);
  });

  it('flags items explicitly set to 0 stock in inventory', () => {
    const requestedItems = { 'item-a': 1 };
    const currentInventory = { 'item-a': 0 };
    const outOfStock = validateInventory(requestedItems, currentInventory);
    expect(outOfStock).toEqual(['item-a']);
  });

  it('flags all requested items as out of stock when currentInventory is empty', () => {
    const requestedItems = { 'item-a': 1, 'item-b': 3 };
    const currentInventory = {};
    const outOfStock = validateInventory(requestedItems, currentInventory);
    expect(outOfStock).toEqual(['item-a', 'item-b']);
  });

  it('returns empty array when requestedItems is empty', () => {
    const outOfStock = validateInventory({}, { 'item-a': 10 });
    expect(outOfStock).toEqual([]);
  });
});
```

---

## 3. Missing Edge Cases for `calculateStripeAmount`

### Scenarios to Test
1. **Line Items with Zero Quantity:**
   - Items with `quantity: 0` should evaluate to `0` and not affect total amount.
2. **Zero Unit Amount (Free Items / Promos):**
   - Items with `unit_amount: 0` (e.g. free promotional items) should contribute `0` to total sum.
3. **Negative Line Items (Discounts / Credit Adjustments):**
   - Line items with negative `unit_amount` or negative `quantity` representing line-item level discounts.
4. **Large Amounts and Quantities:**
   - Multi-item calculation with large integer amounts to verify numeric aggregation accuracy without unexpected float precision bugs.

### Proposed Test Additions
```typescript
describe('calculateStripeAmount - Edge Cases', () => {
  it('ignores line items with 0 quantity or 0 unit_amount', () => {
    const lineItems: StripeLineItem[] = [
      {
        price_data: { currency: 'usd', product_data: { name: 'Free Gift' }, unit_amount: 0 },
        quantity: 1,
      },
      {
        price_data: { currency: 'usd', product_data: { name: 'Out of stock line' }, unit_amount: 2500 },
        quantity: 0,
      },
    ];

    const total = calculateStripeAmount(lineItems);
    expect(total).toBe(0);
  });

  it('correctly handles line items with negative amounts or quantities (discounts)', () => {
    const lineItems: StripeLineItem[] = [
      {
        price_data: { currency: 'usd', product_data: { name: 'Widget' }, unit_amount: 2000 },
        quantity: 1,
      },
      {
        price_data: { currency: 'usd', product_data: { name: 'Discount Code' }, unit_amount: -500 },
        quantity: 1,
      },
    ];

    const total = calculateStripeAmount(lineItems);
    expect(total).toBe(1500); // 2000 - 500 = 1500 ($15.00)
  });
});
```

---

## 4. Execution & Verification Steps
1. Append the missing edge case test suites to `shared/order-logic.test.ts`.
2. Run test suite using `npx vitest run shared/order-logic.test.ts` to verify all new edge case assertions pass.
