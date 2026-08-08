import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = process.env.KV_REST_API_URL
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN as string,
    })
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Basic security - in a real app use actual auth
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET || 'dev-secret'}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!redis) {
    return res.status(500).json({ error: 'Redis not configured' });
  }

  try {
    const paidKeys = await redis.keys('paid_order:*');
    const shippedKeys = await redis.keys('shipped_order:*');
    
    const allKeys = [...paidKeys, ...shippedKeys];
    
    if (allKeys.length === 0) {
      return res.status(200).json({ orders: [] });
    }

    const rawOrders = await redis.mget(...allKeys);
    
    const orders = rawOrders
      .filter(Boolean)
      .map((raw: any, index: number) => {
        const order = typeof raw === 'string' ? JSON.parse(raw) : raw;
        // Inject the order ID from the key
        const key = allKeys[index];
        order.id = key.split(':')[1];
        return order;
      });

    // Sort by paidAt descending
    orders.sort((a: any, b: any) => {
      const dateA = a.paidAt ? new Date(a.paidAt).getTime() : 0;
      const dateB = b.paidAt ? new Date(b.paidAt).getTime() : 0;
      return dateB - dateA;
    });

    return res.status(200).json({ orders });
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
