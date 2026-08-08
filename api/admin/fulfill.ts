import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import EasyPostClient from '@easypost/api';

const redis = process.env.KV_REST_API_URL
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN as string,
    })
  : null;

const easypostApiKey = process.env.EASYPOST_API_KEY || 'fake_key';
const easypost = new EasyPostClient(easypostApiKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET || 'dev-secret'}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  if (!redis) {
    return res.status(500).json({ error: 'Redis not configured' });
  }

  try {
    const rawOrder = await redis.get<string>(`paid_order:${orderId}`);
    if (!rawOrder) {
      return res.status(404).json({ error: 'Order not found or already fulfilled' });
    }

    const order = typeof rawOrder === 'string' ? JSON.parse(rawOrder) : rawOrder;

    if (!order.shipmentId || !order.rateId) {
      return res.status(400).json({ error: 'Order is missing EasyPost shipmentId or rateId' });
    }

    // Purchase the shipping label via EasyPost
    const shipment = await easypost.Shipment.retrieve(order.shipmentId);
    const boughtShipment = await easypost.Shipment.buy(shipment.id, order.rateId);

    // Update order status and attach tracking info
    order.status = 'shipped';
    order.trackingNumber = boughtShipment.tracking_code;
    order.trackingUrl = boughtShipment.tracker.public_url;
    order.shippedAt = new Date().toISOString();

    // Save to shipped_order: and delete from paid_order:
    await redis.set(`shipped_order:${orderId}`, JSON.stringify(order));
    await redis.del(`paid_order:${orderId}`);

    return res.status(200).json({ success: true, order });
  } catch (error: any) {
    console.error('Fulfill order error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
