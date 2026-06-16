import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const PLAN_LIMITS = { free: 8, no_ads: 10, basic: 24, premium: 50 };

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Nepřihlášen' });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Neplatný token' });

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Reset počítadla pokud je nový den
    const today = new Date().toISOString().split('T')[0];
    if (profile.analyses_reset_date !== today) {
      await supabase.from('profiles').update({
        analyses_today: 0,
        analyses_reset_date: today
      }).eq('id', user.id);
      profile.analyses_today = 0;
    }

    const limit = PLAN_LIMITS[profile.plan] || 8;
    return res.status(200).json({
      ...profile,
      limit,
      remaining: Math.max(0, limit - profile.analyses_today)
    });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
