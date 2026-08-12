import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import { Redis } from '@upstash/redis';
import { sanitizeConfig, getLineItems, getPartsLineItems, extractRequestedItems } from '../shared/pricing';
import { validateInventory, calculateStripeAmount } from '../shared/order-logic';



const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
  apiVersion: '2023-10-16',
});

const redis = process.env.KV_REST_API_URL
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN as string,
    })
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { config, customBuilds, cart, parts, shipmentId, rateId, email } = req.body || {};
    
    let validConfig = config;
    if (config) {
      validConfig = sanitizeConfig(config);
    }

    const requestedItems = extractRequestedItems({ config: validConfig, customBuilds, cart, parts });

    if (redis) {
      const inventoryData = (await redis.hgetall('inventory')) as Record<string, number> || {};
      const outOfStock = validateInventory(requestedItems, inventoryData);

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

    const amount = calculateStripeAmount(lineItems);

    // Store full order payload in Redis to avoid Stripe's 500-char metadata limit
    if (!redis) {
      console.error('[create-payment-intent] Redis is unavailable — checkout cannot proceed without order storage.');
      return res.status(503).json({ error: 'Order storage is unavailable. Please try again later.' });
    }

    const orderId = randomUUID();
    const orderPayload = { 
      config: validConfig, customBuilds, cart, parts,
      status: 'cart',
      shipmentId, rateId, email
    };
    await redis.set(`cart:${orderId}`, JSON.stringify(orderPayload), { ex: 604800 }); // 7-day TTL

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        order_id: orderId,
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
