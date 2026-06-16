export default async function handler(req, res) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RAPIDAPI_KEY není nastaven' });

  const HOST = 'sofascore.p.rapidapi.com';
  const headers = { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': HOST };

  const { type, sport = 'football' } = req.query;
  const validSports = ['football','basketball','tennis','ice-hockey','baseball','american-football'];
  const sportKey = validSports.includes(sport) ? sport : 'football';

  try {
    if (type === 'live') {
      const r = await fetch(`https://${HOST}/sport/${sportKey}/events/live`, { headers });
      return res.status(200).json(await r.json());
    } else if (type === 'future') {
      const all = [];
      const today = new Date();
      for (let i = 1; i <= 5; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        try {
          const r = await fetch(`https://${HOST}/sport/${sportKey}/scheduled-events/${dateStr}`, { headers });
          const data = await r.json();
          const items = data.events || [];
          items.forEach(item => { item._fetchDate = dateStr; });
          all.push(...items);
        } catch(e) {}
      }
      return res.status(200).json({ events: all });
    } else {
      const today = new Date().toISOString().split('T')[0];
      const r = await fetch(`https://${HOST}/sport/${sportKey}/scheduled-events/${today}`, { headers });
      return res.status(200).json(await r.json());
    }
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
