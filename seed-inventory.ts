import { allItems, stickCaps } from './shared/catalog';
import 'dotenv/config';

// The API URL to update inventory (defaults to local dev server)
const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';
const ADMIN_SECRET = process.env.ADMIN_SECRET;

async function seedInventory() {
  if (!ADMIN_SECRET) {
    console.error("Error: ADMIN_SECRET environment variable is missing in your .env file.");
    process.exit(1);
  }

  const inventory: Record<string, number> = {};

  // Extract stick cap IDs so we can easily check if an item is a stick cap
  const stickCapIds = new Set(stickCaps.map(c => c.id));

  // Set of 3D printed items
  const printed3D = new Set([
    'switch-mount-3d',
    'trigger-plugs-tall',
    'trigger-plugs-short',
    'magnet-mount',
    'notch-ruler'
  ]);

  for (const item of allItems) {
    // 1. Default for everything is 40
    let quantity = 40;

    // 2. Apply specific overrides (order matters for overlapping rules)
    if (item.id === 'gc-cap-tpu') {
      quantity = 0;
    } else if (printed3D.has(item.id)) {
      quantity = 200;
    } else if (item.id === 'orange') {
      quantity = 2;
    } else if (item.id === 'emerald') {
      quantity = 0;
    } else if (item.id === 'cable-paracord-3m') {
      quantity = 50;
    } else if (item.id === 'screwdriver-set') {
      quantity = 15;
    } else if (item.id === 'white-buttons') {
      quantity = 1;
    } else if (item.id === 'chrome-buttons') {
      quantity = 1;
    } else if (item.id === 'clear-buttons') {
      quantity = 5;
    } else if (item.id === 'slider-pot-alps') {
      quantity = 25;
    } else if (item.id === 'slider-pot-noble') {
      quantity = 25;
    } else if (item.id === 'tactile-z') {
      quantity = 80;
    } else if (item.id === 'stickbox-t1-t2') {
      quantity = 20;
    } else if (item.id === 'other-3rd-party-cap') {
      quantity = 0;
    } else if (item.id === 'wii-cap-black-good') {
      quantity = 4;
    } else if (item.id === 'wii-cap-black-okay' || item.id === 'wii-cap-black-poor') {
      quantity = 0;
    } else if (item.id === 'trigger-paddle-star-elecrow') {
      quantity = 50;
    } else if (item.id === 'trigger-paddle-oem') {
      quantity = 45;
    } else if (stickCapIds.has(item.id)) {
      // General rule for stick caps that didn't match the specific cases above
      quantity = 10;
    }

    inventory[item.id] = quantity;
  }

  console.log('--- Proposed Inventory Data ---');
  console.log(JSON.stringify(inventory, null, 2));
  console.log('-------------------------------');

  // Remove the `return;` below to actually send the request when you're ready
  console.log('\nScript is in dry-run mode. Exiting without making API request.');
  // return;

  console.log(`\nSending inventory update to ${API_URL}/api/inventory...`);

  try {
    const res = await fetch(`${API_URL}/api/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': ADMIN_SECRET
      },
      body: JSON.stringify(inventory)
    });

    const data = await res.json();
    if (res.ok) {
      console.log('✅ Success! Inventory updated:', data);
    } else {
      console.error('❌ Failed to update inventory:', data);
    }
  } catch (err) {
    console.error('❌ Request failed:', err);
  }
}

seedInventory();
