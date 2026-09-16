import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './calculate-shipping';
import { easypost } from './utils/clients';

vi.mock('./utils/clients', () => ({
  easypost: {
    Shipment: {
      create: vi.fn(),
    }
  }
}));

describe('calculate-shipping', () => {
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

  it('returns 400 if zip or country are missing', async () => {
    mockReq = { body: { country: 'US' }, method: 'POST' };
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Destination zip and country are required' });

    mockReq = { body: { zip: '12345' }, method: 'POST' };
    await handler(mockReq as VercelRequest, mockRes as VercelResponse);
    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it('returns successful shipping rates formatting', async () => {
    mockReq = {
      method: 'POST',
      body: {
        zip: '12345',
        country: 'US',
        cart: { 'phob-1': 1 } // To calculate some weight
      }
    };

    const mockShipment = {
      id: 'shp_123',
      rates: [
        { id: 'rate_1', service: 'Priority', carrier: 'USPS', rate: '5.50' },
        { id: 'rate_2', service: 'Ground', carrier: 'UPS', rate: '10.00' }
      ]
    };

    (easypost.Shipment.create as any).mockResolvedValue(mockShipment);

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      shipmentId: 'shp_123',
      rates: [
        { id: 'rate_1', service: 'Priority', carrier: 'USPS', rateInCents: 550 },
        { id: 'rate_2', service: 'Ground', carrier: 'UPS', rateInCents: 1000 },
      ]
    });

    expect(easypost.Shipment.create).toHaveBeenCalledWith(expect.objectContaining({
      to_address: { zip: '12345', country: 'US' },
      parcel: expect.any(Object),
    }));
  });
});
