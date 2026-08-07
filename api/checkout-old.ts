import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { Redis } from '@upstash/redis';
import { sanitizeConfig, getLineItems, getPartsLineItems, extractRequestedItems } from '../shared/pricing';
import { allItems } from '../shared/catalog';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
  apiVersion: '2023-10-16' as any,
});

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
    })
  : null;

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { config, customBuilds, cart, parts } = req.body || {};
    
    let validConfig = config;
    if (config) {
      validConfig = sanitizeConfig(config);
    }

    const requestedItems = extractRequestedItems({ config: validConfig, customBuilds, cart, parts });

    if (redis || process.env.USE_FALLBACK_INVENTORY) {
      // Check inventory
      const outOfStock = [];
      let inventoryData: Record<string, number> = {};
      
      if (redis) {
        inventoryData = (await redis.hgetall('inventory')) as Record<string, number> || {};
      } else {
        // Fallback
        for (const item of Object.keys(requestedItems)) {
          inventoryData[item] = 10;
        }
      }

      for (const [itemId, qty] of Object.entries(requestedItems)) {
        const available = inventoryData[itemId] !== undefined ? Number(inventoryData[itemId]) : 0;
        if (available < (qty as number)) {
          outOfStock.push(itemId);
        }
      }

      if (outOfStock.length > 0) {
        return res.status(400).json({ error: 'One or more items are out of stock.', outOfStock });
      }
    }

    const lineItems = [
      ...(validConfig ? getLineItems(validConfig) : []),
      ...(customBuilds ? customBuilds.flatMap((build: any) => getLineItems(sanitizeConfig(build))) : []),
      ...getPartsLineItems(cart || {}),
    ];

    if (lineItems.length === 0) {
      return res.status(400).json({ error: 'No items in cart' });
    }

    const frontendUrl = process.env.FRONTEND_URL 
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${frontendUrl}/success`,
      cancel_url: `${frontendUrl}/cart`,
      metadata: {
        payload: JSON.stringify({ config: validConfig, customBuilds, cart, parts })
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
