import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from './utils/clients';
import { allItems } from '../shared/catalog';
import { filterTrackedInventory } from './utils/helpers';
import { withMiddleware, withAdminAuth } from './utils/middleware';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    if (redis) {
      const inventory = await redis.hgetall('inventory');
      const filteredInventory = filterTrackedInventory(inventory || {}, allItems);
      return res.status(200).json(filteredInventory);
    } else {
      // Fallback for local development
      if (process.env.NODE_ENV !== 'production') {
        const fallback: Record<string, number> = {};
        for (const item of allItems) {
          if (item.requiresInventory !== false) {
            fallback[item.id] = 10;
          }
        }
        return res.status(200).json(fallback);
      } else {
        return res.status(200).json({});
      }
    }
  }

  if (req.method === 'POST') {
    return withAdminAuth(async (req, res) => {
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
    })(req, res);
  }
}

export default withMiddleware(['GET', 'POST'], handler);
