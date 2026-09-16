import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from './utils/clients';
import { allItems } from '../shared/catalog';
import { filterTrackedInventory } from './utils/helpers';
import { withErrorHandler, withRoute } from './utils/middleware';

async function handleGet(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=60');
  
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

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  if (redis) {
    const redisClient = redis;
    const promises = Object.entries(updates).map(([id, qty]) => {
      return redisClient.hset('inventory', { [id]: Number(qty) });
    });
    await Promise.all(promises);
    return res.status(200).json({ success: true });
  } else {
    return res.status(200).json({ success: true, note: 'Redis not configured, simulated success.' });
  }
}

export default withErrorHandler(
  withRoute({
    GET: handleGet,
    POST: handlePost,
  })
);
