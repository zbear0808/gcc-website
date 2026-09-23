import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis, easypost } from '../utils/clients';
import { withMiddleware } from '../utils/middleware';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  if (!redis) {
    return res.status(500).json({ error: 'Configuration Error: Redis not configured (missing KV_REST_API_URL or KV_REST_API_TOKEN)' });
  }

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
}

export default withMiddleware(['POST'], handler);
