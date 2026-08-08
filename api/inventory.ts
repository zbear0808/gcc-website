import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { allItems } from '../shared/catalog';

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

  if (req.method === 'GET') {
    try {
      if (redis) {
        const inventory = await redis.hgetall('inventory');
        return res.status(200).json(inventory || {});
      } else {
        // Fallback for local development
        if (process.env.NODE_ENV !== 'production') {
          const fallback: Record<string, number> = {};
          for (const item of allItems) {
            fallback[item.id] = 10;
          }
          return res.status(200).json(fallback);
        } else {
          return res.status(200).json({});
        }
      }
    } catch (error: any) {
      console.error('Inventory GET error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  if (req.method === 'POST') {
    const adminSecret = req.headers['x-admin-secret'];
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const updates = req.body;
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Invalid payload' });
      }

      if (redis) {
        const promises = Object.entries(updates).map(([id, qty]) => {
          return redis.hset('inventory', { [id]: Number(qty) });
        });
        await Promise.all(promises);
        return res.status(200).json({ success: true });
      } else {
        return res.status(200).json({ success: true, note: 'Redis not configured, simulated success.' });
      }
    } catch (error: any) {
      console.error('Inventory POST error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
