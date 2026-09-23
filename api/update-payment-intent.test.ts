import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './update-payment-intent';
import { stripe, easypost, redis } from './utils/clients';

vi.mock('./utils/clients', () => ({
  stripe: {
    paymentIntents: {
      retrieve: vi.fn(),
      update: vi.fn(),
    }
  },
  easypost: {
    Shipment: {
      retrieve: vi.fn(),
    }
  },
  redis: {
    get: vi.fn(),
  }
}));

describe('update-payment-intent', () => {
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

  it('returns 400 if required parameters are missing', async () => {
    mockReq = { body: {}, method: 'POST' };
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Missing payment_intent_id' });

    mockReq = { body: { payment_intent_id: 'pi_123' }, method: 'POST' };
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Missing shipment_id or rate_id' });
  });

  it('returns 409 if payment intent is in invalid state', async () => {
    mockReq = {
      method: 'POST',
      body: {
        payment_intent_id: 'pi_123',
        shipment_id: 'shp_123',
        rate_id: 'rate_123'
      }
    };

    (stripe.paymentIntents.retrieve as any).mockResolvedValue({
      id: 'pi_123',
      status: 'succeeded' // invalid state for update
    });

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);
    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith({
      error: expect.stringContaining('PaymentIntent cannot be updated in its current state'),
    });
  });

  it('successfully updates payment intent with correct new amount', async () => {
    mockReq = {
      method: 'POST',
      body: {
        payment_intent_id: 'pi_123',
        shipment_id: 'shp_123',
        rate_id: 'rate_123'
      }
    };

    const mockOrderId = 'order_456';
    const mockOrderPayload = { parts: { 'phob-1': 1 } }; // weight ~ 3oz

    // Mock stripe intent
    (stripe.paymentIntents.retrieve as any).mockResolvedValue({
      id: 'pi_123',
      status: 'requires_payment_method',
      metadata: { order_id: mockOrderId, base_amount: '1000' }, // $10 base
      amount: 1000
    });

    // Mock redis order
    (redis!.get as any).mockResolvedValue(JSON.stringify(mockOrderPayload));

    // Mock easypost shipment
    (easypost.Shipment.retrieve as any).mockResolvedValue({
      id: 'shp_123',
      parcel: { weight: 3 }, // Expected base weight for order is 3
      rates: [
        { id: 'rate_123', rate: '5.00' } // $5 shipping
      ]
    });

    // Mock successful update
    (stripe.paymentIntents.update as any).mockResolvedValue({
      id: 'pi_123',
      amount: 1500 // $10 + $5 = $15
    });

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ success: true, amount: 1500 });
    expect(stripe.paymentIntents.update).toHaveBeenCalledWith('pi_123', { amount: 1500 });
  });

});
