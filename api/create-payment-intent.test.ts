import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './create-payment-intent';
import { stripe, redis } from './utils/clients';
import * as pricing from '../shared/pricing';
import * as orderLogic from '../shared/order-logic';

vi.mock('./utils/clients', () => ({
  stripe: {
    paymentIntents: {
      create: vi.fn(),
    }
  },
  redis: {
    hgetall: vi.fn(),
    set: vi.fn(),
  }
}));

vi.mock('../shared/pricing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../shared/pricing')>();
  return {
    ...actual,
    getPartsLineItems: vi.fn(),
    extractRequestedItems: vi.fn(),
  };
});

vi.mock('../shared/order-logic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../shared/order-logic')>();
  return {
    ...actual,
    validateInventory: vi.fn(),
  };
});

describe('create-payment-intent', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let statusMock: any;
  let jsonMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    jsonMock = vi.fn();
    statusMock = vi.fn(() => ({ json: jsonMock }));
    mockRes = {
      status: statusMock,
      setHeader: vi.fn(),
    } as any;
  });

  it('returns 400 if cart is empty (no items)', async () => {
    mockReq = { body: {}, method: 'POST' };
    (pricing.extractRequestedItems as any).mockReturnValue({});
    (orderLogic.validateInventory as any).mockReturnValue([]);
    (pricing.getPartsLineItems as any).mockReturnValue([]);
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'No items in cart' });
  });

  it('returns 400 if inventory validation fails (out of stock)', async () => {
    mockReq = {
      method: 'POST',
      body: {
        parts: { 'phob-1': 10 } // requesting 10
      }
    };

    (pricing.extractRequestedItems as any).mockReturnValue({ 'phob-1': 10 });
    (orderLogic.validateInventory as any).mockReturnValue(['phob-1']);

    (pricing.getPartsLineItems as any).mockReturnValue([{
        price_data: { unit_amount: 1000 },
        quantity: 10
    }]);

    // Mock redis inventory return only 2
    (redis!.hgetall as any).mockResolvedValue({ 'phob-1': '2' });

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'One or more items are out of stock.',
      outOfStock: [
        'phob-1'
      ]
    });
  });

  it('returns 200 and client secret on successful intent creation', async () => {
    mockReq = {
      method: 'POST',
      body: {
        parts: { 'phob-1': 1 },
        shipmentId: 'shp_123'
      }
    };

    (pricing.extractRequestedItems as any).mockReturnValue({ 'phob-1': 1 });
    (orderLogic.validateInventory as any).mockReturnValue([]);

    (pricing.getPartsLineItems as any).mockReturnValue([{
        price_data: { unit_amount: 1000 },
        quantity: 1
    }]);

    // Mock sufficient inventory
    (redis!.hgetall as any).mockResolvedValue({ 'phob-1': '10' });

    // Mock stripe intent creation
    (stripe.paymentIntents.create as any).mockResolvedValue({
      id: 'pi_345',
      client_secret: 'pi_345_secret_789'
    });

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      id: 'pi_345',
      client_secret: 'pi_345_secret_789'
    });

    expect(redis!.set).toHaveBeenCalledWith(
      expect.stringMatching(/^cart:/),
      expect.stringContaining('"shipmentId":"shp_123"'),
      { ex: 604800 }
    );

    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({
      currency: 'usd',
      amount: expect.any(Number),
      metadata: expect.objectContaining({
        order_id: expect.any(String),
      })
    }));
  });
});
