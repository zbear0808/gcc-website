import Stripe from 'stripe';
import { Redis } from '@upstash/redis';
import EasyPostClient from '@easypost/api';

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ Missing STRIPE_SECRET_KEY in production environment');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
  apiVersion: '2023-10-16' as any,
});

export const easypost = new EasyPostClient(process.env.EASYPOST_API_KEY || 'fake_key');

const isRedisConfigured = Boolean(
  process.env.KV_REST_API_URL &&
  !process.env.KV_REST_API_URL.includes('replace') &&
  process.env.KV_REST_API_TOKEN &&
  !process.env.KV_REST_API_TOKEN.includes('replace') &&
  process.env.USE_FALLBACK_INVENTORY !== 'true'
);

export const redis = isRedisConfigured
  ? new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN as string,
    })
  : null;
