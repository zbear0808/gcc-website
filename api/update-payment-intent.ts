import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import EasyPostClient from '@easypost/api';
import { Redis } from '@upstash/redis';
import { calculateParcel } from '../shared/shipping';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
  apiVersion: '2023-10-16',
});

const easypost = new EasyPostClient(process.env.EASYPOST_API_KEY || 'fake_key');

const redis = process.env.KV_REST_API_URL
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN as string,
    })
  : null;

/** Convert a dollar string like "5.49" to integer cents (549) without floating-point errors. */
export function dollarsToCents(dollarStr: string): number {
  const [dollars, cents = '0'] = dollarStr.split('.');
  const paddedCents = (cents + '00').substring(0, 2);
  return parseInt(dollars, 10) * 100 + parseInt(paddedCents, 10);
}

/** Allowed PaymentIntent statuses for amount updates. */
const MUTABLE_STATUSES = new Set(['requires_payment_method', 'requires_confirmation']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { payment_intent_id, shipment_id, rate_id } = req.body || {};

    if (!payment_intent_id) {
      return res.status(400).json({ error: 'Missing payment_intent_id' });
    }
    if (!shipment_id || !rate_id) {
      return res.status(400).json({ error: 'Missing shipment_id or rate_id' });
    }

    // 1. Retrieve PaymentIntent and validate its status
    const intent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (!MUTABLE_STATUSES.has(intent.status)) {
      console.warn(`[update-payment-intent] Rejected update for PI ${payment_intent_id}: status is "${intent.status}"`);
      return res.status(409).json({
        error: `PaymentIntent cannot be updated in its current state (${intent.status}).`,
      });
    }

    // 2. Validate cart integrity via Redis
    const orderId = intent.metadata.order_id;
    if (!orderId) {
      console.error(`[update-payment-intent] PI ${payment_intent_id} is missing order_id in metadata.`);
      return res.status(400).json({ error: 'PaymentIntent is missing order metadata.' });
    }

    if (!redis) {
      console.error('[update-payment-intent] Redis is unavailable — cannot validate order.');
      return res.status(503).json({ error: 'Order validation service is temporarily unavailable.' });
    }

    const orderPayloadStr = await redis.get(`cart:${orderId}`);
    if (!orderPayloadStr) {
      console.warn(`[update-payment-intent] Cart ${orderId} not found in Redis (expired or missing).`);
      return res.status(404).json({ error: 'Order session expired. Please restart checkout.' });
    }

    const orderPayload = typeof orderPayloadStr === 'string'
      ? JSON.parse(orderPayloadStr)
      : orderPayloadStr;

    // 3. Fetch the shipment from EasyPost and find the selected rate
    const shipment = await easypost.Shipment.retrieve(shipment_id);
    const rate = shipment.rates.find((r: any) => r.id === rate_id);

    if (!rate) {
      console.warn(`[update-payment-intent] Rate ${rate_id} not found on shipment ${shipment_id}.`);
      return res.status(400).json({ error: 'Invalid shipping rate selected.' });
    }

    // 4. Validate that the shipment parcel matches the cart's expected weight
    const expectedParcel = calculateParcel(orderPayload);
    const shipmentWeight = Number(shipment.parcel?.weight ?? 0);

    if (Math.abs(shipmentWeight - expectedParcel.weight) > 0.5) {
      console.error(
        `[update-payment-intent] Parcel weight mismatch for order ${orderId}: ` +
        `shipment=${shipmentWeight}oz, expected=${expectedParcel.weight}oz`
      );
      return res.status(403).json({ error: 'Shipment validation failed. Please restart checkout.' });
    }

    // 5. Calculate new amount using safe integer-cents arithmetic
    let baseAmount = parseInt(intent.metadata.base_amount || '0', 10);
    if (!baseAmount) {
      baseAmount = intent.amount;
    }

    const shippingCents = dollarsToCents(rate.rate);

    if (!Number.isFinite(shippingCents) || shippingCents < 0) {
      console.error(`[update-payment-intent] Invalid shipping cents: ${shippingCents} from rate "${rate.rate}"`);
      return res.status(400).json({ error: 'Invalid shipping rate amount.' });
    }

    const newAmount = baseAmount + shippingCents;

    if (newAmount <= 0) {
      return res.status(400).json({ error: 'Invalid total amount.' });
    }

    // 6. Update the PaymentIntent
    const updatedIntent = await stripe.paymentIntents.update(payment_intent_id, {
      amount: newAmount,
    });

    return res.status(200).json({ success: true, amount: updatedIntent.amount });
  } catch (error: any) {
    console.error('[update-payment-intent] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
