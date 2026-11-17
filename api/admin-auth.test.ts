import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdminAuth } from './utils/middleware';

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return res as typeof res & VercelResponse;
}

const req = (authorization?: string) => ({ headers: { authorization } }) as unknown as VercelRequest;

describe('withAdminAuth', () => {
  const original = process.env.ADMIN_SECRET;
  const handler = vi.fn((_req: VercelRequest, res: VercelResponse) => res.status(200).json({ ok: true }));

  beforeEach(() => {
    process.env.ADMIN_SECRET = 'hunter2';
    handler.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.ADMIN_SECRET = original;
    vi.restoreAllMocks();
  });

  it('rejects requests with no token', () => {
    const res = mockRes();
    withAdminAuth(handler)(req(), res);
    expect(res.statusCode).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it('rejects requests with the wrong token', () => {
    const res = mockRes();
    withAdminAuth(handler)(req('Bearer nope'), res);
    expect(res.statusCode).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it('allows requests with the correct token', () => {
    const res = mockRes();
    withAdminAuth(handler)(req('Bearer hunter2'), res);
    expect(res.statusCode).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('fails closed when ADMIN_SECRET is not set', () => {
    delete process.env.ADMIN_SECRET;
    const res = mockRes();
    withAdminAuth(handler)(req('Bearer anything'), res);
    expect(res.statusCode).toBe(500);
    expect(handler).not.toHaveBeenCalled();
  });
});
