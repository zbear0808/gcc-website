import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { Redis } from '@upstash/redis';
import { sanitizeConfig, getLineItems, getPartsLineItems, extractRequestedItems } from '../shared/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
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
      const outOfStock = [];
      let inventoryData: Record<string, number> = {};
      
      if (redis) {
        inventoryData = (await redis.hgetall('inventory')) as Record<string, number> || {};
      } else {
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

    const amount = lineItems.reduce((acc: number, item: any) => {
      return acc + (item.price_data.unit_amount * item.quantity);
    }, 0);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        payload: JSON.stringify({ config: validConfig, customBuilds, cart, parts }),
        base_amount: amount.toString()
      }
    });

    return res.status(200).json({ 
      client_secret: paymentIntent.client_secret,
      id: paymentIntent.id
    });
  } catch (error: any) {
    console.error('Create PaymentIntent error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
