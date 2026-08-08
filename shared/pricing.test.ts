import { describe, it, expect } from 'vitest';
import { sanitizeConfig, calculateTotal, getLineItems } from './pricing';
import type { ConfiguratorState } from './types';

describe('Pricing Logic (Pure Functions)', () => {
  describe('sanitizeConfig', () => {
    it('sets defaults for missing fields in full-builds', () => {
      const config: ConfiguratorState = {
        product: 'full-build',
      };
      
      const sanitized = sanitizeConfig(config);
      expect(sanitized.shell).toBe('indigo');
      expect(sanitized.buttons).toBe('oem-buttons');
      expect(sanitized.cable).toBe('cable-paracord-3m');
    });

    it('strips OEM cable if non-OEM shell is selected', () => {
      const config: ConfiguratorState = {
        product: 'full-build',
        shell: 'clear', // extremerate shell
        cable: 'cable-oem',
      };
      
      const sanitized = sanitizeConfig(config);
      expect(sanitized.cable).toBe('cable-paracord-3m');
    });

    it('keeps OEM cable if OEM shell is selected', () => {
      const config: ConfiguratorState = {
        product: 'full-build',
        shell: 'indigo', // oem shell
        cable: 'cable-oem',
      };
      
      const sanitized = sanitizeConfig(config);
      expect(sanitized.cable).toBe('cable-oem');
    });

    it('removes worn shell discount if shell color does not support it', () => {
      const config: ConfiguratorState = {
        product: 'full-build',
        shell: 'emerald',
        wornShell: true,
      };
      
      const sanitized = sanitizeConfig(config);
      expect(sanitized.wornShell).toBe(false);
    });

    it('keeps worn shell discount if shell color supports it', () => {
      const config: ConfiguratorState = {
        product: 'full-build',
        shell: 'indigo',
        wornShell: true,
      };
      
      const sanitized = sanitizeConfig(config);
      expect(sanitized.wornShell).toBe(true);
    });
  });

  describe('calculateTotal', () => {
    it('calculates the base price of a full build with no mods', () => {
      const config: ConfiguratorState = { product: 'full-build' };
      // base(97) + indigo(5) + oem-buttons(0) + rumble-oem(3) + cable-paracord-3m(15) 
      // + slider-pot-alps(0) + tactile-z(0) + membrane-extremerate(0) + gc-cap-okay(2)
      // 97 + 5 + 3 + 15 + 2 = 122
      const total = calculateTotal(config);
      expect(total).toBe(122);
    });

    it('calculates the correct total with mods, addons, and premiums', () => {
      const config: ConfiguratorState = {
        product: 'full-build',
        shell: 'clear', // 0
        cable: 'cable-paracord-3m', // 15
        rumble: 'rumble-non-oem', // 2
        stickCap: 'gc-cap-good', // 4
        notchesFirefox: true, // 40
        notchStyle: 'subtle', // 15 premium
        kalihChoco: true, // 40 premium (default both)
      };
      // base(97) + mods(40) + addons(0) + choco(40) + subtle(15)
      // + shell(0) + buttons(0) + rumble(2) + cable(15) + pots(0) + z(0) + membrane(0) + stick(4)
      // 97 + 40 + 40 + 15 + 2 + 15 + 4 = 213
      const total = calculateTotal(config);
      expect(total).toBe(213);
    });

    it('calculates DIY kit price correctly (no shell/mods applied)', () => {
      const config: ConfiguratorState = {
        product: 'diy-kit',
        cable: 'cable-paracord-3m', // 15
        stickCap: 'gc-cap-good', // 4
        notchesFirefox: true, // should be ignored
      };
      // base(45) + cable(15) + pots(0) + z(0) + membrane(0) + stick(4) = 64
      const total = calculateTotal(config);
      expect(total).toBe(64);
    });
  });

  describe('getLineItems', () => {
    it('outputs Subtle Notches Premium line item when applicable', () => {
      const config: ConfiguratorState = {
        product: 'full-build',
        notchesFirefox: true,
        notchStyle: 'subtle',
      };
      const items = getLineItems(config);
      const hasSubtlePremium = items.some(
        (item) => item.price_data.product_data.name === 'Subtle Notches Premium'
      );
      expect(hasSubtlePremium).toBe(true);
    });

    it('reduces base item price for worn shell discount', () => {
      const config: ConfiguratorState = {
        product: 'full-build',
        shell: 'indigo',
        wornShell: true,
      };
      // Base build is 97. With worn shell it should be 93.
      const items = getLineItems(config);
      const baseItem = items.find((item) => item.price_data.product_data.name.includes('PhobGCC Full Build'));
      expect(baseItem).toBeDefined();
      expect(baseItem?.price_data.unit_amount).toBe(9300); // 93 * 100
    });
  });
});
