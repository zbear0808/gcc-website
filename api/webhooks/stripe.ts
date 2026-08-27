import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { extractRequestedItems } from '../../shared/pricing';
import { stripe, redis } from '../utils/clients';

export const config = {
  api: { bodyParser: false },
};

function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return res.status(400).send('Missing signature or endpoint secret.');
  }

  try {
    const rawBody = await getRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, sig as string, endpointSecret);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.order_id;

      if (orderId && redis) {
        let raw = await redis.get<string>(`cart:${orderId}`);
        // Fallback for in-flight orders from before the cart: migration
        if (!raw) {
          raw = await redis.get<string>(`order:${orderId}`);
        }
        if (raw) {
          const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
          const requestedItems = extractRequestedItems(payload);

          const pipeline = redis.multi();

          Object.entries(requestedItems).forEach(([id, qty]) => {
            pipeline.hincrby('inventory', id, -(qty as number));
          });

          // Update status and move to paid_order prefix
          payload.status = 'paid';
          payload.paidAt = new Date().toISOString();
          payload.stripePaymentIntentId = paymentIntent.id;
          
          pipeline.set(`paid_order:${orderId}`, JSON.stringify(payload));
          
          // Clean up the old keys
          pipeline.del(`cart:${orderId}`);
          pipeline.del(`order:${orderId}`);

          await pipeline.exec();
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
