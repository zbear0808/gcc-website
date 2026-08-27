import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from '../utils/clients';
import { parseAndSortOrders } from '../utils/helpers';
import { withMiddleware, withAdminAuth } from '../utils/middleware';

async function handler(_req: VercelRequest, res: VercelResponse) {
  if (!redis) {
    return res.status(500).json({ error: 'Redis not configured' });
  }

  const paidKeys = await redis.keys('paid_order:*');
  const shippedKeys = await redis.keys('shipped_order:*');
  
  const allKeys = [...paidKeys, ...shippedKeys];
  
  if (allKeys.length === 0) {
    return res.status(200).json({ orders: [] });
  }

  const rawOrders = await redis.mget(...allKeys);
  const orders = parseAndSortOrders(rawOrders, allKeys);

  return res.status(200).json({ orders });
}

export default withMiddleware(['GET'], withAdminAuth(handler));
