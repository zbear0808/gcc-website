import { describe, it, expect } from 'vitest';
import { renderBuildOptions } from './CartPage';
import type { ConfiguratorState } from '@shared/types';

describe('CartPage utils', () => {
  describe('renderBuildOptions', () => {
    it('Returns empty array for empty config', () => {
      const result = renderBuildOptions({});
      expect(result).toEqual([]);
    });

    it('Returns shell label for a build with a shell', () => {
      const config: ConfiguratorState = { shell: 'indigo' };
      const result = renderBuildOptions(config);
      // indigo is "Indigo" in catalog, but it uses getItem(shell)?.label || shell
      // I'll check that it returns something like "Shell: Indigo" or "Shell: indigo"
      expect(result.some(opt => opt.startsWith('Shell:'))).toBe(true);
    });

    it('Returns all component labels (buttons, cable, rumble, etc.)', () => {
      const config: ConfiguratorState = {
        buttons: 'oem-buttons',
        cable: 'cable-paracord-3m',
        rumble: 'rumble-oem',
        sliderPots: 'slider-pot-alps',
        zButton: 'tactile-z',
        membrane: 'membrane-extremerate',
        stickCap: 'gc-cap-poor'
      };
      const result = renderBuildOptions(config);
      expect(result.some(opt => opt.startsWith('Buttons:'))).toBe(true);
      expect(result.some(opt => opt.startsWith('Cable:'))).toBe(true);
      expect(result.some(opt => opt.startsWith('Rumble:'))).toBe(true);
      expect(result.some(opt => opt.startsWith('Slider Potentiometers:'))).toBe(true);
      expect(result.some(opt => opt.startsWith('Z Button:'))).toBe(true);
      expect(result.some(opt => opt.startsWith('Membranes:'))).toBe(true);
      expect(result.some(opt => opt.startsWith('Stick Cap:'))).toBe(true);
    });

    it('Includes notch info with style', () => {
      const config: ConfiguratorState = {
        notchesFirefox: true,
        notchStyle: 'subtle'
      };
      const result = renderBuildOptions(config);
      expect(result).toContain('Notches: Firefox (subtle)');
    });

    it('Formats trigger plugs with side and length', () => {
      const config: ConfiguratorState = {
        triggerPlugs: true,
        triggerPlugSide: 'l',
        triggerPlugLength: 'tall'
      };
      const result = renderBuildOptions(config);
      expect(result).toContain('Trigger Plugs: Left (tall)');
    });

    it('Formats kailh choco with side', () => {
      const config: ConfiguratorState = {
        kailhChoco: true,
        kailhChocoSide: 'both'
      };
      const result = renderBuildOptions(config);
      expect(result).toContain('kailh Choco Triggers: Both');
    });

    it('Includes Spring Cut and Detachable Trigger Paddle Mod', () => {
      const config: ConfiguratorState = {
        springCut: true,
        detachableTriggerPaddle: true
      };
      const result = renderBuildOptions(config);
      expect(result).toContain('Spring Cut');
      expect(result).toContain('Detachable Trigger Paddle Mod');
    });
  });
});
