import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
  apiVersion: '2023-10-16' as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { payment_intent_id, selected_shipping_rate } = req.body || {};

    if (!payment_intent_id || selected_shipping_rate === undefined) {
      return res.status(400).json({ error: 'Missing payment_intent_id or selected_shipping_rate' });
    }

    const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    let baseAmount = parseInt(intent.metadata.base_amount || '0', 10);
    if (!baseAmount) {
        baseAmount = intent.amount;
    }

    const shippingCents = Math.round(parseFloat(selected_shipping_rate) * 100);
    const newAmount = baseAmount + shippingCents;

    const updatedIntent = await stripe.paymentIntents.update(payment_intent_id, {
      amount: newAmount,
    });

    return res.status(200).json({ success: true, amount: updatedIntent.amount });
  } catch (error: any) {
    console.error('Update PaymentIntent error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
