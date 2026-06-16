import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const PLAN_LIMITS = { free: 8, no_ads: 10, basic: 24, premium: 50 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Nepřihlášen' });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Neplatný token' });

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const limit = PLAN_LIMITS[profile.plan] || 8;
  const today = new Date().toISOString().split('T')[0];

  let count = profile.analyses_today;
  if (profile.analyses_reset_date !== today) count = 0;

  if (count >= limit) return res.status(429).json({ error: 'Denní limit vyčerpán', limit, plan: profile.plan });

  await supabase.from('profiles').update({
    analyses_today: count + 1,
    analyses_reset_date: today
  }).eq('id', user.id);

  return res.status(200).json({ remaining: limit - count - 1, limit });
}
