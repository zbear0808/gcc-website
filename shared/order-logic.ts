import type { StripeLineItem } from './types';

/**
 * Validates that all requested items are in stock.
 * Returns an array of item IDs that are out of stock.
 * If all items are in stock, returns an empty array.
 */
export function validateInventory(
  requestedItems: Record<string, number>,
  currentInventory: Record<string, number>
): string[] {
  const outOfStock: string[] = [];

  for (const [itemId, qty] of Object.entries(requestedItems)) {
    const available = currentInventory[itemId] !== undefined ? Number(currentInventory[itemId]) : 0;
    if (available < qty) {
      outOfStock.push(itemId);
    }
  }

  return outOfStock;
}

/**
 * Calculates the total Stripe charge amount from an array of StripeLineItems.
 */
export function calculateStripeAmount(lineItems: StripeLineItem[]): number {
  return lineItems.reduce((acc, item) => {
    return acc + item.price_data.unit_amount * item.quantity;
  }, 0);
}
