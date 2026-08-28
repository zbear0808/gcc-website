import type { VercelRequest, VercelResponse } from '@vercel/node';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse> | void | VercelResponse;

export function withErrorHandler(handler: Handler): Handler {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error: unknown) {
      console.error('API error:', error);
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      return res.status(500).json({ error: message });
    }
  };
}

export function withMethods(allowedMethods: string[], handler: Handler): Handler {
  return (req, res) => {
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    if (!allowedMethods.includes(req.method || '')) {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    return handler(req, res);
  };
}

export function withRoute(handlers: Partial<Record<string, Handler>>): Handler {
  return (req, res) => {
    const method = req.method || 'GET';
    if (method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    const handler = handlers[method];
    if (!handler) {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    return handler(req, res);
  };
}

export function withAdminAuth(handler: Handler): Handler {
  return (req, res) => {
    const authHeader = req.headers.authorization;
    const adminSecret = process.env.ADMIN_SECRET;
    
    if (!adminSecret) {
      console.error('Missing ADMIN_SECRET in environment');
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1]?.trim() : undefined;
    if (!token || token !== adminSecret.trim()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return handler(req, res);
  };
}

export function withMiddleware(methods: string[], handler: Handler): Handler {
  return withMethods(methods, withErrorHandler(handler));
}
