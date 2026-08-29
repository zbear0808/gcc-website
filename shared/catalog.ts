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
  StickCapOption,
  CatalogCategory,
  TriggerPaddlePcbOption,
  CatalogItem,
  ConfiguratorState,
} from './types';

// Products

export const products: Product[] = [
  {
    id: 'diy-kit',
    label: 'DIY Kit',
    description:
      'Board with slider pots, T3 stickboxes, DH1212 magnets + mounts, Z button, GCC cable, notch ruler, trigger plugs, cell motor, 6 pin ribbon cable, and trigger paddle PCBs. THIS IS FOR DIY, parts do not come soldered on',
    price: 45,
    image: '/images/products/diy-kit.webp',
    weight: 10,
  },
  // {
  //   id: '0-solder-diy-kit',
  //   label: '0-Solder DIY Kit',
  //   description:
  //     'Board with slider pots, T3 stickboxes, DH1212 magnets + mounts, Z button, GCC cable, notch ruler, trigger plugs, cell motor, 6 pin ribbon cable, and trigger paddle PCBs. All components are pre-soldered, you just need to mount the stickboxes and magnets and calibrate.',
  //   price: 79,
  //   image: '/images/products/diy-kit-no-solder.webp',
  //   weight: 10,
  // },
  {
    id: 'full-build',
    label: 'PhobGCC Full Build',
    description: 'Complete controller with T3 stickboxes — choose your shell and mods.',
    price: 97,
    image: '/images/products/full-build.webp',
    weight: 12,
  },
];

// Modifications (Full Build only)

export const mods: ModOption[] = [
  { id: 'notchesFirefox', label: 'Firefox', price: 40, image: '/images/mods/firefox.webp', requiresInventory: false },
  { id: 'notchesWavedash', label: 'Wavedash', price: 20, image: '/images/mods/wavedash.webp', requiresInventory: false },
  { id: 'detachableTriggerPaddle', label: 'Detachable Trigger Paddle Mod', description: 'Uses 2 pin jst connectors instead of soldered on wires.', price: 6, image: '/images/parts/trigger-paddle.webp', requiresInventory: false },
];

// Addons (Full Build only)

export const addons: AddonOption[] = [
  { id: 'triggerPlugs', label: 'Trigger Plugs', price: 0, image: '/images/addons/trigger-plugs-short.webp', requiresInventory: false },
  { id: 'kailhChoco', label: 'kailh Choco Switch Mechanical Trigger', image: '/images/addons/kailh-choco.webp' },
  { id: 'springCut', label: 'Cut Springs', price: 0, image: '/images/addons/cut-springs.webp', requiresInventory: false },
  { id: 'triggerMetalBracket', label: 'Trigger Metal Bracket', price: 0, image: '/images/addons/trigger-metal-bracket.webp', requiresInventory: false },
];

// Shells

export const shells: ShellOption[] = [
  { id: 'cherry', label: 'Cherry Blossom', type: 'extremerate', price: 0, individualPrice: 15, image: '/images/shells/cherry.webp', weight: 4 },
  { id: 'white', label: 'White', type: 'extremerate', price: 0, individualPrice: 15, image: '/images/shells/white.webp', weight: 4 },
  { id: 'clear', label: 'Clear', type: 'extremerate', price: 0, individualPrice: 15, image: '/images/shells/clear.webp', weight: 4 },
  { id: 'indigo', label: 'Indigo', type: 'oem', price: 5, individualPrice: 15, image: '/images/shells/indigo.webp', weight: 4 },
  { id: 'black', label: 'Black', type: 'oem', price: 5, individualPrice: 15, image: '/images/shells/black.webp', weight: 4 },
  { id: 'smash-ultimate-black', label: 'Smash Ultimate Black', type: 'oem', price: 5, individualPrice: 20, image: '/images/shells/black.webp', weight: 4 },
  { id: 'platinum', label: 'Platinum', type: 'oem', price: 5, individualPrice: 20, image: '/images/shells/platinum.webp', weight: 4 },
  { id: 'orange', label: 'Spice Orange', type: 'oem', price: 15, individualPrice: 30, image: '/images/shells/orange.webp', weight: 4 },
  { id: 'emerald', label: 'Emerald Blue', type: 'oem', price: 25, individualPrice: 50, image: '/images/shells/emerald.webp', weight: 4 },
];

// Cables

export const cables: CableOption[] = [
  { id: 'cable-3rd-party-3m', label: '3rd Party 3m', description: 'Brand new. Has an indigo plug and no metal shielding under the rubber sleeve.', price: 0, individualPrice: 3, image: '/images/parts/cable-3rd-party.webp', weight: 2 },
  { id: 'cable-paracord-3m', label: 'Black Paracord 3m', description: 'Brand new with metal shielding. Uses a JST header.', price: 15, individualPrice: 22, image: '/images/parts/cable-paracord.webp', weight: 2 },
  { id: 'cable-oem', label: 'OEM Cable', description: 'All used. 2m, or 3m for Smash Ultimate Black.', price: 0, image: '/images/parts/cable-oem.webp', weight: 2 },
];

// Buttons

export const buttons: ButtonOption[] = [
  { id: 'oem-buttons', label: 'OEM Buttons', type: 'oem', price: 0, individualPrice: 3, image: '/images/buttons/oem.webp' },
  { id: 'gray-buttons', label: 'Gray Buttons', type: 'extremerate', price: 2, individualPrice: 5, image: '/images/buttons/gray.webp' },
  { id: 'white-buttons', label: 'White Buttons', type: 'extremerate', price: 7, individualPrice: 10, image: '/images/buttons/white.webp' },
  { id: 'chrome-buttons', label: 'Chrome Buttons', type: 'extremerate', price: 7, individualPrice: 10, image: '/images/buttons/chrome.webp' },
  { id: 'clear-buttons', label: 'Clear Buttons', type: 'extremerate', price: 3, individualPrice: 5, image: '/images/buttons/clear.webp' },
];

// Rumble Motors

export const rumbles: RumbleOption[] = [
  { id: 'rumble-oem', label: 'OEM Rumble Motor', price: 3, individualPrice: 3, image: '/images/parts/rumble-oem.webp' },
  { id: 'rumble-non-oem', label: 'Non-OEM Rumble Motor', price: 2, individualPrice: 1, image: '/images/parts/rumble-non-oem.webp' },
];

// Slider Potentiometers

export const sliderPots: SliderPotOption[] = [
  { id: 'slider-pot-alps', label: 'Alps Slider Potentiometers', description: 'Pack of 2. OEM. With fresh deox fader lube.', price: 0, individualPrice: 12, image: '/images/parts/slider-pot-alps.webp' },
  { id: 'slider-pot-noble', label: 'Noble Slider Potentiometers', description: 'Pack of 2. OEM. With fresh deox fader lube.', price: 2, individualPrice: 14, image: '/images/parts/slider-pot-noble.webp' },
];

// Z Buttons

export const zButtons: ZButtonOption[] = [
  { id: 'tactile-z', label: 'Tactile Z Button', description: 'Tactile switch for the Z button.', price: 0, individualPrice: 1, image: '/images/parts/tactile-z.webp' },
  { id: 'oem-z', label: 'OEM Z Button', description: 'Softer, original style Z button.', price: 0, individualPrice: 1 },
];

// Rubber Membranes

export const membranes: MembraneOption[] = [
  { id: 'membrane-extremerate', label: 'Extremerate Clear Rubber Membranes', description: 'The most stiff and clicky ones.', price: 0, individualPrice: 2, image: '/images/parts/membrane-clear.webp' },
  { id: 'membrane-jcd', label: 'JCD Dark Grey Rubber Membranes', description: 'In the middle, more clicky than OEM. (My personal preference)', price: 0, individualPrice: 2, image: '/images/parts/membrane-dark-grey.webp' },
  { id: 'membrane-oem', label: 'OEM Rubber Membranes', description: 'The most squishy ones.', price: 0, individualPrice: 3, image: '/images/parts/membrane-oem.webp' },
];

// Stick Caps

export const stickCaps: StickCapOption[] = [
  { id: 'gc-cap-good', label: 'OEM GameCube Stick Cap (good)', description: 'OEM GameCube stick cap in good condition.', price: 4, individualPrice: 5, image: '/images/parts/gc-cap-good.webp' },
  { id: 'gc-cap-okay', label: 'OEM GameCube Stick Cap (Okay)', description: 'OEM GameCube stick cap in okay condition.', price: 2, individualPrice: 3, image: '/images/parts/gc-cap-okay.webp' },
  { id: 'gc-cap-poor', label: 'OEM GameCube Stick Cap (Poor)', description: 'OEM GameCube stick cap in poor condition.', price: 0, individualPrice: 2, image: '/images/parts/gc-cap-poor.webp' },
  { id: 'gc-cap-tpu', label: 'TPU Cap', description: 'OEM GameCube stick cap fitted with a 3D printed TPU top.', price: 5, individualPrice: 6, image: '/images/parts/gc-cap-tpu.webp' },
  { id: 'wii-cap-good', label: 'OEM Wii Stick Cap (good)', description: 'OEM stick cap in good condition.', price: 4, individualPrice: 5, image: '/images/parts/wii-cap-good.webp' },
  { id: 'wii-cap-okay', label: 'OEM Wii Stick Cap (Okay)', description: 'OEM stick cap in okay condition.', price: 2, individualPrice: 3, image: '/images/parts/wii-cap-okay.webp' },
  { id: 'wii-cap-poor', label: 'OEM Wii Stick Cap (Poor)', description: 'OEM stick cap in poor condition.', price: 0, individualPrice: 2, image: '/images/parts/wii-cap-poor.webp' },
  { id: 'wii-cap-black-good', label: 'OEM Wii Stick Cap - Black (good)', description: 'OEM black stick cap in good condition.', price: 10, individualPrice: 11, image: '/images/parts/wii-cap-good.webp' },
  { id: 'wii-cap-black-okay', label: 'OEM Wii Stick Cap - Black (Okay)', description: 'OEM black stick cap in okay condition.', price: 8, individualPrice: 9, image: '/images/parts/wii-cap-okay.webp' },
  { id: 'wii-cap-black-poor', label: 'OEM Wii Stick Cap - Black (Poor)', description: 'OEM black stick cap in poor condition.', price: 6, individualPrice: 8, image: '/images/parts/wii-cap-poor.webp' },
  { id: 'extremerate-cap', label: 'Extremerate 3rd Party Stick Cap', description: 'Third party stick cap by Extremerate.', price: 2, individualPrice: 3, image: '/images/parts/extremerate-cap.webp' },
  { id: 'jcd-cap', label: 'JCD 3rd Party Stick Cap', description: 'Third party stick cap by JCD.', price: 2, individualPrice: 3, image: '/images/parts/jcd-cap.webp' },
  { id: 'other-3rd-party-cap', label: 'Other 3rd Party Stick Cap', description: 'Other generic third party stick cap.', price: 1, individualPrice: 2, image: '/images/parts/other-3rd-party-cap.webp' },
];

// Individual Parts

export const parts: PartItem[] = [
  {
    id: 'board-only',
    label: 'PhobGCC Board Only',
    description: 'Just the board — no attachments, no shell.',
    price: 0,
    individualPrice: 20,
    image: '/images/products/board-only.webp',
    weight: 2,
  },
  { id: 'board-oem', label: 'OEM Board (T3 Compatible)', description: 'Original GameCube controller board. Only T3 stickbox compatible boards (no older models).', price: 0, individualPrice: 5, image: '/images/products/board-only.webp' },
  { id: 'notch-ruler', label: 'Notch Ruler', description: 'Guide tool to help with creating firefox and wavedash notches.', price: 0, individualPrice: 2, image: '/images/parts/notch-ruler.webp' },
  { id: 'stickbox', label: 'T3 Stickbox', description: 'OEM T3 stickboxes cleaned with ipa and relubed with Shin Etsu silicone lubricant.', price: 0, individualPrice: 12, image: '/images/parts/stickbox.webp' },
  { id: 'stickbox-t1-t2', label: 'T1/T2 Stickbox', description: 'Old T1 and T2 OEM stickboxes.', price: 0, individualPrice: 2, image: '/images/parts/stickbox.webp' },
  { id: 'stickbox-pot', label: 'Stickbox Potentiometers UNTESTED (Pack of 8)', description: "Untested OEM Noble brand potentiometers for stickboxes, can't guarantee that they can pivot, but from a random batch I tested most could.", individualPrice: 2, price: 0, image: '/images/parts/stickbox-pot.webp' },
  { id: 'magnet-mount', label: 'Magnet Mounts (Pack of 4)', description: 'Mounts for magnets used with Hall effect sensors.', price: 0, individualPrice: 2, image: '/images/parts/magnet-mount.webp' },
  { id: 'dh1212-magnet', label: 'DH1212 Magnets (Pack of 4)', description: 'Magnets for use with Hall effect sensors.', price: 1, individualPrice: 2, image: '/images/parts/dh1212-magnet.webp' },
  { id: '6-pin-ribbon-cable', label: '6 pin ribbon cable', description: 'Ribbon cable for connecting the main board to the C stick daughter board.', price: 0, individualPrice: 1, image: '/images/parts/ribbon-cable.webp' },
  { id: 'switch-kailh-choco-red', label: 'Kailh Choco Switch (Red Linear)', description: 'Individual Kailh Choco red linear mechanical switch for custom triggers.', price: 0, individualPrice: 2, image: '/images/addons/kailh-choco.webp' },
  { id: 'switch-kailh-choco-brown', label: 'Kailh Choco Switch (Brown Tactile)', description: 'Individual Kailh Choco brown tactile mechanical switch for custom triggers.', price: 0, individualPrice: 2, image: '/images/addons/kailh-choco.webp' },
  { id: 'switch-kailh-choco-white', label: 'Kailh Choco Switch (White Clicky)', description: 'Individual Kailh Choco white clicky mechanical switch for custom triggers.', price: 0, individualPrice: 2, image: '/images/addons/kailh-choco.webp' },
  { id: 'jst-pigtail-header', label: '2-Pin JST Pigtail and Header', description: '2-pin JST pigtail and header combo for mechanical switch wiring.', price: 0, individualPrice: 1 },
  { id: 'switch-mount-3d', label: '3D Printed Switch Mount', description: '3D printed mount for the mechanical switch.', price: 0, individualPrice: 2 },
  { id: 'screwdriver-set', label: 'Tri-wing + JIS Screwdriver Set', description: 'Includes both a tri-wing and JIS screwdriver needed to open GameCube controllers.', price: 0, individualPrice: 4, image: '/images/parts/screwdrivers.webp' },
  { id: 'triggerMetalBracket', label: 'Trigger Metal Bracket', description: 'OEM part that was found on older gcc only, and not on any t3 controllers.', individualPrice: 4, price: 3, image: '/images/parts/trigger-metal-bracket.webp' },
];

// Trigger Plugs
export const triggerPlugs: PartItem[] = [
  { id: 'trigger-plugs-tall', label: 'Tall Trigger Plugs', description: 'Tall trigger plugs for shorter trigger pull.', price: 0, individualPrice: 3, image: '/images/addons/trigger-plugs-tall.webp' },
  { id: 'trigger-plugs-short', label: 'Short Trigger Plugs', description: 'Short trigger plugs for slightly shorter trigger pull.', price: 0, individualPrice: 3, image: '/images/addons/trigger-plugs-short.webp' },
];

// Trigger Paddle PCBs
export const triggerPaddlePcbs: TriggerPaddlePcbOption[] = [
  { id: 'trigger-paddle-star-elecrow', label: 'Star Paddle (Elecrow)', description: 'Star-shaped custom trigger paddle PCB manufactured by Elecrow.', price: 0, individualPrice: 1, image: '/images/parts/trigger-paddle-elecrow.webp' },
  { id: 'trigger-paddle-oem', label: 'OEM Paddle', description: 'Original style trigger paddle PCB.', price: 0, individualPrice: 1, image: '/images/parts/trigger-paddle-oem.webp' },
];

// Derived Collections

export const allItems: CatalogItem[] = [
  ...products,
  ...shells,
  ...buttons,
  ...mods,
  ...addons,
  ...parts,
  ...triggerPlugs,
  ...triggerPaddlePcbs,
  ...cables,
  ...rumbles,
  ...sliderPots,
  ...zButtons,
  ...membranes,
  ...stickCaps,
];

/** Items that can be purchased individually (have an individualPrice) */
export const individualItems: CatalogItem[] = [
  ...addons,
  ...shells,
  ...buttons,
  ...parts,
  ...triggerPlugs,
  ...triggerPaddlePcbs,
  ...rumbles,
  ...cables,
  ...sliderPots,
  ...zButtons,
  ...membranes,
  ...stickCaps,
].filter((item) => 'individualPrice' in item && item.individualPrice != null);

/** All parts */
export const otherParts = parts;

// Parts Catalog (for the /parts page)

export const catalog: CatalogCategory[] = [
  {
    id: 'shells',
    label: 'Controller Shells',
    description: 'Original and third-party controller shells. OEM and Extremerate available.',
    image: '/images/parts/shells.webp',
    subtypes: shells,
  },
  {
    id: 'buttons',
    label: 'Buttons',
    description: 'Replacement buttons for your controller.',
    image: '/images/parts/buttons.webp',
    subtypes: buttons,
  },
  {
    id: 'stick-caps',
    label: 'Sticks',
    description: 'Replacement stick caps in various conditions and styles.',
    image: '/images/parts/gc-cap-good.webp',
    subtypes: stickCaps,
  },
  {
    id: 'rumble-motors',
    label: 'Rumble Motors',
    description: 'Rumble motors for your controller.',
    image: '/images/parts/rumble-motors.webp',
    subtypes: rumbles,
  },
  {
    id: 'cables',
    label: 'Controller Cables',
    description: 'Controller cables and replacements.',
    image: '/images/parts/cable-paracord.webp',
    subtypes: cables,
  },
  {
    id: 'slider-pots',
    label: 'Slider Potentiometers',
    description: 'Replacement slide potentiometers for triggers.',
    image: '/images/parts/slider-pot.webp',
    subtypes: sliderPots,
  },
  {
    id: 'z-buttons',
    label: 'Z Buttons',
    description: 'Tactile or OEM Z Buttons.',
    image: '/images/parts/tactile-z.webp',
    subtypes: zButtons,
  },
  {
    id: 'membranes',
    label: 'Rubber Membranes',
    description: 'Rubber membranes for the A, B, X, Y, Start, and D-Pad buttons.',
    image: '/images/parts/membrane-clear.webp',
    subtypes: membranes,
  },
  {
    id: 'trigger-plugs',
    label: 'Trigger Plugs',
    description: 'Trigger plugs for shorter trigger pull.',
    image: '/images/addons/trigger-plugs.webp',
    subtypes: triggerPlugs,
  },
  {
    id: 'trigger-paddle-pcbs',
    label: 'Trigger Paddle PCBs',
    description: 'PCBs for custom trigger paddles.',
    image: '/images/parts/trigger-paddle.webp',
    subtypes: triggerPaddlePcbs,
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

export function getCategoryIdForItem(itemId: string): string | undefined {
  return fullCatalog.find((c) => c.subtypes.some((s) => s.id === itemId))?.id;
}
// Helpers to extract logic out of the render phase
export const getNotchOptions = (_config: ConfiguratorState) => {
  return mods.filter(m => m.id === 'notchesWavedash' || m.id === 'notchesFirefox');
};

export const getTriggerModOptions = (config: ConfiguratorState) => {
  return addons
    .filter(a => a.id === 'triggerPlugs' || a.id === 'kailhChoco' || a.id === 'triggerMetalBracket')
    .map(a =>
      a.id === 'kailhChoco'
        ? { ...a, label: 'kailh Choco Switch', price: (config.kailhChocoSide ?? 'both') === 'both' ? 40 : 30 }
        : a.id === 'triggerMetalBracket'
          ? { ...a, price: (config.triggerMetalBracketSide ?? 'both') === 'both' ? 6 : 3 }
          : a
    );
};

export const getSpringOptions = () => addons.filter(a => a.id === 'springCut');

export const getDetachableTriggerOptions = () => mods.filter(m => m.id === 'detachableTriggerPaddle');

