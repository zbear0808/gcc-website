/** Convert a dollar string like "5.49" to integer cents (549) without floating-point errors. */
export function dollarsToCents(dollarStr: string): number {
  const [dollars, cents = '0'] = String(dollarStr).split('.');
  const paddedCents = (cents + '00').substring(0, 2);
  return parseInt(dollars, 10) * 100 + parseInt(paddedCents, 10);
}

/** Transform raw EasyPost rate objects into a simplified format with integer cents. */
export function formatShippingRates(rates: any[]): { id: string; service: string; carrier: string; rateInCents: number }[] {
  return rates.map((rate: any) => {
    const rateInCents = dollarsToCents(rate.rate);
    return {
      id: rate.id,
      service: rate.service,
      carrier: rate.carrier,
      rateInCents,
    };
  });
}

/** Filter inventory to only include items that require inventory tracking. */
export function filterTrackedInventory(
  rawInventory: Record<string, unknown>,
  catalogItems: { id: string; requiresInventory?: boolean }[]
): Record<string, number> {
  const filtered: Record<string, number> = {};
  for (const [id, qty] of Object.entries(rawInventory || {})) {
    const item = catalogItems.find(i => i.id === id);
    if (item?.requiresInventory !== false) {
      filtered[id] = Number(qty);
    }
  }
  return filtered;
}

/** Parse raw Redis order values and sort by paidAt descending. */
export function parseAndSortOrders(rawOrders: any[], keys: string[]): any[] {
  const orders = rawOrders
    .filter(Boolean)
    .map((raw: any, index: number) => {
      const order = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const key = keys[index];
      order.id = key.split(':')[1];
      return order;
    });

  orders.sort((a: any, b: any) => {
    const dateA = a.paidAt ? new Date(a.paidAt).getTime() : 0;
    const dateB = b.paidAt ? new Date(b.paidAt).getTime() : 0;
    return dateB - dateA;
  });

  return orders;
}
