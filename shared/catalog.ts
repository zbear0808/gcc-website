import type {
  Product,
  ShellOption,
  ButtonOption,
  CableOption,
  RumbleOption,
  SliderPotOption,
  ZButtonOption,
  MembraneOption,
  ModOption,
  AddonOption,
  PartItem,
  CatalogItem,
  CatalogCategory,
} from './types';

// ==================
// Products
// ==================

export const products: Product[] = [
  {
    id: 'board-only',
    label: 'PhobGCC Board Only',
    description: 'Just the board — no attachments, no shell.',
    price: 20,
    image: '/images/products/board-only.png',
  },
  {
    id: 'diy-kit',
    label: 'DIY Kit',
    description:
      'Board with slider pots, T3 stickboxes, DH1212 magnets + mounts, Z button, GCC cable, notch ruler, trigger plugs, cell motor, 6 pin ribbon cable, and trigger paddle PCBs. THIS IS FOR DIY, parts do not come soldered on',
    price: 45,
    image: '/images/products/diy-kit.png',
  },
  {
    id: '0-solder-diy-kit',
    label: '0-Solder DIY Kit',
    description:
      'Board with slider pots, T3 stickboxes, DH1212 magnets + mounts, Z button, GCC cable, notch ruler, trigger plugs, cell motor, 6 pin ribbon cable, and trigger paddle PCBs. All components are pre-soldered, you just need to mount the stickboxes and magnets and calibrate.',
    price: 79,
    image: '/images/products/diy-kit-no-solder.png',
  },
  {
    id: 'full-build',
    label: 'PhobGCC Full Build',
    description: 'Complete controller with T3 stickboxes — choose your shell and mods.',
    price: 99,
    image: '/images/products/full-build.png',
  },
];

// ==================
// Modifications (Full Build only)
// ==================

export const mods: ModOption[] = [
  { id: 'notchesFirefox', label: 'Firefox Notches', price: 40, image: '/images/mods/firefox.png' },
  { id: 'notchesWavedash', label: 'Wavedash Notches', price: 20, image: '/images/mods/wavedash.png' },
];

// ==================
// Addons (Full Build only)
// ==================

export const addons: AddonOption[] = [
  { id: 'triggerPlugs', label: 'Trigger Plugs', image: '/images/addons/trigger-plugs.png' },
  { id: 'springCut', label: 'Cut Springs', image: '/images/addons/cut-springs.png' },
];

// ==================
// Shells
// ==================

export const shells: ShellOption[] = [
  { id: 'cherry', label: 'Cherry Blossom', type: 'extremerate', price: 0, individualPrice: 15, image: '/images/shells/cherry.png' },
  { id: 'white', label: 'White', type: 'extremerate', price: 0, individualPrice: 15, image: '/images/shells/white.png' },
  { id: 'clear', label: 'Clear', type: 'extremerate', price: 0, individualPrice: 15, image: '/images/shells/clear.png' },
  { id: 'indigo', label: 'Indigo', type: 'oem', price: 5, individualPrice: 15, image: '/images/shells/indigo.png' },
  { id: 'black', label: 'Black', type: 'oem', price: 5, individualPrice: 15, image: '/images/shells/black.png' },
  { id: 'smash-ultimate-black', label: 'Smash Ultimate Black', type: 'oem', price: 5, individualPrice: 20, image: '/images/shells/black.png' },
  { id: 'platinum', label: 'Platinum', type: 'oem', price: 5, individualPrice: 20, image: '/images/shells/platinum.png' },
  { id: 'orange', label: 'Spice Orange', type: 'oem', price: 10, individualPrice: 25, image: '/images/shells/orange.png' },
  { id: 'emerald', label: 'Emerald Blue', type: 'oem', price: 20, individualPrice: 45, image: '/images/shells/emerald.png' },
];

// ==================
// Cables
// ==================

export const cables: CableOption[] = [
  { id: 'cable-3rd-party-3m', label: '3rd Party 3m', description: 'Brand new. Has an indigo plug and no metal shielding under the rubber sleeve.', price: 0, individualPrice: 5, image: '/images/parts/cable-3rd-party.png' },
  { id: 'cable-paracord-3m', label: 'Detachable Black Paracord 3m (JST header)', description: 'Brand new with metal shielding.', price: 15, individualPrice: 22, image: '/images/parts/cable-paracord.png' },
  { id: 'cable-oem', label: 'OEM Cable (2m, or 3m for Smash Ultimate Black)', description: 'All used.', price: 0, image: '/images/parts/cable-oem.png' },
];

// ==================
// Buttons
// ==================

export const buttons: ButtonOption[] = [
  { id: 'oem-buttons', label: 'OEM Buttons', type: 'oem', price: 0, individualPrice: 5, image: '/images/buttons/oem.png' },
  { id: 'gray-buttons', label: 'Gray Buttons', type: 'extremerate', price: 0, individualPrice: 5, image: '/images/buttons/gray.png' },
  { id: 'white-buttons', label: 'White Buttons', type: 'extremerate', price: 5, individualPrice: 10, image: '/images/buttons/white.png' },
  { id: 'chrome-buttons', label: 'Chrome Buttons', type: 'extremerate', price: 5, individualPrice: 10, image: '/images/buttons/chrome.png' },
];

// ==================
// Rumble Motors
// ==================

export const rumbles: RumbleOption[] = [
  { id: 'rumble-none', label: 'No Rumble Motor', price: 0, image: '/images/parts/rumble-none.png' },
  { id: 'rumble-oem', label: 'OEM Rumble Motor', price: 3, individualPrice: 10, image: '/images/parts/rumble-oem.png' },
  { id: 'rumble-non-oem', label: 'Non-OEM Rumble Motor', price: 0, individualPrice: 1, image: '/images/parts/rumble-non-oem.png' },
];

// ==================
// Slider Potentiometers
// ==================

export const sliderPots: SliderPotOption[] = [
  { id: 'slider-pot-alps', label: 'Alps Slider Potentiometers (Pack of 2)', description: 'Replacement slide potentiometers for triggers. All slider potentiometers are relubricated with deox fader lubricant before shipping.', price: 0, individualPrice: 12, image: '/images/parts/slider-pot.png' },
  { id: 'slider-pot-noble', label: 'Noble Slider Potentiometers (Pack of 2)', description: 'Replacement slide potentiometers for triggers. All slider potentiometers are relubricated with deox fader lubricant before shipping.', price: 2, individualPrice: 14, image: '/images/parts/slider-pot.png' },
];

// ==================
// Z Buttons
// ==================

export const zButtons: ZButtonOption[] = [
  { id: 'tactile-z', label: 'Tactile Z Button', description: 'Tactile switch for the Z button.', price: 0, individualPrice: 1, image: '/images/parts/tactile-z.png' },
  { id: 'oem-z', label: 'OEM Z Button', description: 'Softer, original style Z button.', price: 0, individualPrice: 1 },
];

// ==================
// Rubber Membranes
// ==================

export const membranes: MembraneOption[] = [
  { id: 'membrane-extremerate', label: 'Extremerate Clear Rubber Membranes', description: 'The most stiff and clicky ones.', price: 0, individualPrice: 1, image: '/images/parts/membrane-clear.png' },
  { id: 'membrane-jcd', label: 'JCD Dark Grey Rubber Membranes', description: 'In the middle, more clicky than OEM. (My personal preference)', price: 0, individualPrice: 1, image: '/images/parts/membrane-dark-grey.png' },
  { id: 'membrane-oem', label: 'OEM Rubber Membranes', description: 'The most squishy ones.', price: 0, individualPrice: 1, image: '/images/parts/membrane-oem.png' },
];

// ==================
// Individual Parts
// ==================

export const parts: PartItem[] = [
  { id: 'notch-ruler', label: 'Notch Ruler', description: 'Guide tool to help with creating firefox and wavedash notches.', price: 0, individualPrice: 2, image: '/images/parts/notch-ruler.png' },
  { id: 'stickbox', label: 'T3 Stickbox', description: 'OEM T3 stickboxes cleaned with ipa and relubed with Shin Etsu silicone lubricant.', price: 0, individualPrice: 12, image: '/images/parts/stickbox.png' },
  { id: 'stickbox-pot', label: 'Stickbox Potentiometers UNTESTED (Pack of 8)', description: "Untested OEM Noble brand potentiometers for stickboxes, can't guarantee that they can pivot, but from a random batch I tested most could.", individualPrice: 2, price: 0, image: '/images/parts/stickbox-pot.png' },
  { id: 'wii-cap-new', label: 'OEM Wii Classic Stick Cap (New)', description: 'OEM stick cap in like-new condition.', price: 4, individualPrice: 5, image: '/images/parts/wii-cap-new.png' },
  { id: 'wii-cap-okay', label: 'OEM Wii Classic Stick Cap (Okay)', description: 'OEM stick cap in okay condition.', price: 2, individualPrice: 3, image: '/images/parts/wii-cap-okay.png' },
  { id: 'wii-cap-poor', label: 'OEM Wii Classic Stick Cap (Poor)', description: 'OEM stick cap in poor condition.', price: 1, individualPrice: 2, image: '/images/parts/wii-cap-poor.png' },
  { id: 'magnet-mount', label: 'Magnet Mounts (Pack of 4)', description: 'Mounts for magnets used with Hall effect sensors.', price: 0, individualPrice: 2, image: '/images/parts/magnet-mount.png' },
  { id: 'dh1212-magnet', label: 'DH1212 Magnets (Pack of 4)', description: 'Magnets for use with Hall effect sensors.', price: 1, individualPrice: 2, image: '/images/parts/dh1212-magnet.png' },
  { id: '6-pin-ribbon-cable', label: '6 pin ribbon cable', description: 'Ribbon cable for connecting the main board to the C stick daughter board.', price: 0, individualPrice: 1, image: '/images/parts/ribbon-cable.png' },
  { id: 'trigger-paddle-pcbs', label: 'Trigger Paddle PCBs (Pack of 2)', description: 'PCBs for custom trigger paddles.', price: 0, individualPrice: 1, image: '/images/parts/trigger-paddle.png' },
];

// ==================
// Derived Collections
// ==================

export const allItems: CatalogItem[] = [
  ...products,
  ...shells,
  ...buttons,
  ...(mods as unknown as CatalogItem[]),
  ...(addons as unknown as CatalogItem[]),
  ...parts,
  ...cables,
  ...rumbles,
  ...sliderPots,
  ...zButtons,
  ...membranes,
];

/** Items that can be purchased individually (have an individualPrice) */
export const individualItems: CatalogItem[] = [
  ...addons,
  ...shells,
  ...buttons,
  ...parts,
  ...rumbles,
  ...cables,
  ...sliderPots,
  ...zButtons,
  ...membranes,
].filter((item) => 'individualPrice' in item && item.individualPrice != null);

/** Wii stick caps */
export const wiiCaps = parts.filter((p) => p.id.startsWith('wii-cap'));

/** All parts except wii caps */
export const otherParts = parts.filter((p) => !p.id.startsWith('wii-cap'));

// ==================
// Parts Catalog (for the /parts page)
// ==================

export const catalog: CatalogCategory[] = [
  {
    id: 'shells',
    label: 'Controller Shells',
    description: 'Original and third-party controller shells. OEM and Extremerate available.',
    image: '/images/parts/shells.png',
    subtypes: shells,
  },
  {
    id: 'buttons',
    label: 'Buttons',
    description: 'Replacement buttons for your controller.',
    image: '/images/parts/buttons.png',
    subtypes: buttons,
  },
  {
    id: 'wii-caps',
    label: 'OEM Wii Classic Stick Caps',
    description: 'Replacement stick caps in various conditions.',
    image: '/images/parts/wii-caps.png',
    subtypes: wiiCaps,
  },
  {
    id: 'rumble-motors',
    label: 'Rumble Motors',
    description: 'Rumble motors for your controller.',
    image: '/images/parts/rumble-motors.png',
    subtypes: rumbles.filter((r) => r.id !== 'rumble-none'),
  },
  {
    id: 'cables',
    label: 'Controller Cables',
    description: 'Controller cables and replacements.',
    image: '/images/parts/cable-paracord.png',
    subtypes: cables,
  },
  {
    id: 'slider-pots',
    label: 'Slider Potentiometers',
    description: 'Replacement slide potentiometers for triggers.',
    image: '/images/parts/slider-pot.png',
    subtypes: sliderPots,
  },
  {
    id: 'z-buttons',
    label: 'Z Buttons',
    description: 'Tactile or OEM Z Buttons.',
    image: '/images/parts/tactile-z.png',
    subtypes: zButtons,
  },
  {
    id: 'membranes',
    label: 'Rubber Membranes',
    description: 'Rubber membranes for the A, B, X, Y, Start, and D-Pad buttons.',
    image: '/images/parts/membrane-clear.png',
    subtypes: membranes,
  },
];

/** Full catalog including individual parts that don't belong to a category */
export const fullCatalog: CatalogCategory[] = [
  ...catalog,
  ...otherParts.map((part) => ({
    id: part.id,
    label: part.label,
    description: part.description ?? '',
    image: part.image ?? '',
    subtypes: [part],
  })),
];
