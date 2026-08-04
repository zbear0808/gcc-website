import type { CheckoutPayload, ParcelDimensions } from './types';
import { allItems } from './catalog';
import { extractRequestedItems } from './pricing';

// Standard packaging weight in ounces (e.g., box + bubble wrap)
const PACKAGING_WEIGHT_OZ = 3;

// Default weight for small items that don't have a weight defined
const DEFAULT_ITEM_WEIGHT_OZ = 1;

export function calculateParcel(payload: CheckoutPayload): ParcelDimensions {
  let totalWeight = PACKAGING_WEIGHT_OZ;
  let controllerCount = 0;
  let hasBulkyItems = false;

  const requestedItems = extractRequestedItems(payload);

  for (const [itemIdRaw, quantity] of Object.entries(requestedItems)) {
    // Strip "-worn" suffix from shells to match catalog item
    const itemId = itemIdRaw.replace('-worn', '');
    
    if (itemId === 'full-build' || itemId === 'diy-kit' || itemId === '0-solder-diy-kit') {
      controllerCount += quantity;
    }

    const item = allItems.find(i => i.id === itemId);
    const weight = item?.weight ?? DEFAULT_ITEM_WEIGHT_OZ;
    totalWeight += weight * quantity;
    
    // Check if the item is bulky (like a full build, DIY kit, or shell)
    if (item && item.weight && item.weight >= 4) {
       hasBulkyItems = true;
    }
  }

  // Determine Dimensions based on placeholder tiers
  let length = 6;
  let width = 4;
  let height = 2; // Small Box / Bubble Mailer

  if (controllerCount >= 2 || (controllerCount === 1 && hasBulkyItems && totalWeight > 24)) {
    // Large Box
    length = 12;
    width = 8;
    height = 6;
  } else if (controllerCount === 1 || hasBulkyItems) {
    // Medium Box
    length = 8;
    width = 6;
    height = 4;
  }

  return {
    weight: totalWeight,
    length,
    width,
    height,
  };
}
