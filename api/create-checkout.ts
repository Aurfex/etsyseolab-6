import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24-preview', // Latest stable
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { plan } = req.body;
    
    // Define prices based on plan
    let priceId = '';
    if (plan === 'growth') priceId = process.env.STRIPE_PRICE_GROWTH || 'price_growth_placeholder';
    if (plan === 'elite') priceId = process.env.STRIPE_PRICE_ELITE || 'price_elite_placeholder';

    if (!priceId) {
        return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/settings`,
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe Session Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
