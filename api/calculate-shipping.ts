import type { VercelRequest, VercelResponse } from '@vercel/node';
import EasyPostClient from '@easypost/api';
import { calculateParcel } from '../shared/shipping';

const easypostApiKey = process.env.EASYPOST_API_KEY || 'fake_key';
const easypost = new EasyPostClient(easypostApiKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { zip } = req.body || {};
    if (!zip) {
      return res.status(400).json({ error: 'Destination zip code is required' });
    }

    const parcel = calculateParcel(req.body);

    const shipment = await easypost.Shipment.create({
      to_address: {
        zip,
        country: 'US',
      },
      from_address: {
        zip: process.env.SHIPPING_ORIGIN_ZIP || '98122',
        city: process.env.SHIPPING_ORIGIN_CITY || 'Seattle',
        state: process.env.SHIPPING_ORIGIN_STATE || 'WA',
        country: 'US',
      },
      parcel: {
        weight: parcel.weight,
        length: parcel.length,
        width: parcel.width,
        height: parcel.height,
      },
    });

    const rates = shipment.rates.map((rate: any) => ({
      id: rate.id,
      service: rate.service,
      carrier: rate.carrier,
      rate: parseFloat(rate.rate),
    }));

    return res.status(200).json({ rates, shipmentId: shipment.id });
  } catch (error: any) {
    console.error('Calculate shipping error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
