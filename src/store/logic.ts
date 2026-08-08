import type { ConfiguratorState, Cart, Inventory } from '@shared/types';
import { sanitizeConfig } from '@shared/pricing';

export function toggleModLogic(currentConfig: ConfiguratorState, modId: string): ConfiguratorState {
  const current = currentConfig[modId as keyof ConfiguratorState] as boolean | undefined;
  const newVal = !current;
  let updated = { ...currentConfig, [modId]: newVal };

  // Firefox and wavedash notches are mutually exclusive
  if (modId === 'notchesFirefox' && newVal) {
    updated = { ...updated, notchesWavedash: false };
  }
  if (modId === 'notchesWavedash' && newVal) {
    updated = { ...updated, notchesFirefox: false };
  }

  // Trigger Plugs and Kalih Choco are mutually exclusive
  if (modId === 'triggerPlugs' && newVal) {
    updated = { ...updated, kalihChoco: false };
  }
  if (modId === 'kalihChoco' && newVal) {
    updated = { ...updated, triggerPlugs: false };
  }

  return sanitizeConfig(updated);
}

export function updateCartQuantityLogic(
  currentCart: Cart,
  inventory: Inventory,
  itemId: string,
  delta: number
): Cart {
  const current = currentCart[itemId] ?? 0;
  // Default stock to a high number if inventory data is missing to prevent accidentally zeroing out items
  const stock = inventory[itemId] ?? 99;
  
  // Math.max(0, ...) ensures we never go below 0
  // Math.min(stock, ...) ensures we never exceed stock limit
  const newVal = Math.min(stock, Math.max(0, current + delta));
  
  return { ...currentCart, [itemId]: newVal };
}
