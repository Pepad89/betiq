import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

// Stripe Price IDs - budou vytvořeny ručně ve Stripe dashboardu
// Zatím použijeme placeholder, uživatel je doplní
const PLANS = {
  no_ads:  { name: 'BetIQ No Ads',  price: 9900,  interval: 'month' },
  basic:   { name: 'BetIQ Basic',   price: 19900, interval: 'month' },
  premium: { name: 'BetIQ Premium', price: 34900, interval: 'month' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Nepřihlášen' });

  const { plan } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: 'Neplatný plán' });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Neplatný token' });

  const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { supabase_id: user.id } });
    customerId = customer.id;
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{
      price_data: {
        currency: 'czk',
        product_data: { name: PLANS[plan].name },
        unit_amount: PLANS[plan].price,
        recurring: { interval: PLANS[plan].interval }
      },
      quantity: 1
    }],
    success_url: `https://betiq-nine.vercel.app/?payment=success&plan=${plan}`,
    cancel_url: `https://betiq-nine.vercel.app/?payment=cancelled`,
    metadata: { plan, supabase_id: user.id }
  });

  return res.status(200).json({ url: session.url });
}
