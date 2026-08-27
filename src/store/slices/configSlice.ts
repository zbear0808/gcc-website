import type { StateCreator } from 'zustand';
import type { ConfiguratorState } from '@shared/types';
import { sanitizeConfig } from '@shared/pricing';
import { toggleModLogic } from '../logic';

export interface ConfigSlice {
  config: ConfiguratorState;
  customBuilds: ConfiguratorState[];
  updateConfig: (updater: Partial<ConfiguratorState> | ((prev: ConfiguratorState) => Partial<ConfiguratorState>)) => void;
  toggleMod: (modId: keyof ConfiguratorState) => void;
  addCustomBuild: (config: ConfiguratorState) => void;
  removeCustomBuild: (index: number) => void;
  clearConfig: () => void;
}

export const createConfigSlice: StateCreator<ConfigSlice, [], [], ConfigSlice> = (set) => ({
  config: sanitizeConfig({ product: 'full-build' }),
  customBuilds: [],

  updateConfig: (updater) =>
    set((state) => {
      const updates = typeof updater === 'function' ? updater(state.config) : updater;
      return { config: sanitizeConfig({ ...state.config, ...updates }) };
    }),

  toggleMod: (modId) =>
    set((state) => ({ config: toggleModLogic(state.config, modId) })),

  addCustomBuild: (config) =>
    set((state) => ({ customBuilds: [...state.customBuilds, config] })),

  removeCustomBuild: (index) =>
    set((state) => ({
      customBuilds: state.customBuilds.filter((_, i) => i !== index),
    })),

  clearConfig: () => set({ customBuilds: [], config: sanitizeConfig({ product: 'full-build' }) }),
});
