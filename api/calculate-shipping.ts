import type { VercelRequest, VercelResponse } from '@vercel/node';
import { easypost } from './utils/clients';
import { calculateParcel } from '../shared/shipping';
import { formatShippingRates } from './utils/helpers';
import { withMiddleware } from './utils/middleware';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { zip, country } = req.body || {};
  if (!zip || !country) {
    return res.status(400).json({ error: 'Destination zip and country are required' });
  }

  const parcel = calculateParcel(req.body);

  const shipment = await easypost.Shipment.create({
    to_address: {
      zip,
      country,
    },
    from_address: {
      zip: process.env.SHIPPING_ORIGIN_ZIP || '98122',
      city: process.env.SHIPPING_ORIGIN_CITY || 'Seattle',
      state: process.env.SHIPPING_ORIGIN_STATE || 'WA',
      country: process.env.SHIPPING_ORIGIN_COUNTRY || 'US',
    },
    parcel: {
      weight: parcel.weight,
      length: parcel.length,
      width: parcel.width,
      height: parcel.height,
    },
  });

  const rates = formatShippingRates(shipment.rates);

  return res.status(200).json({ rates, shipmentId: shipment.id });
}

export default withMiddleware(['POST'], handler);
