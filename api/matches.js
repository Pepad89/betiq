export default async function handler(req, res) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RAPIDAPI_KEY není nastaven' });

  const HOST = 'api-football-v1.p.rapidapi.com';
  const BASE = `https://${HOST}/v3`;

  const headers = {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': HOST,
  };

  const { type } = req.query;

  try {
    if (type === 'live') {
      const response = await fetch(`${BASE}/fixtures?live=all`, { headers });
      const data = await response.json();
      return res.status(200).json(data);

    } else if (type === 'future') {
      const allFixtures = [];
      const today = new Date();

      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        try {
          const response = await fetch(`${BASE}/fixtures?date=${dateStr}`, { headers });
          const data = await response.json();
          const items = data.response || [];
          items.forEach(item => { item._fetchDate = dateStr; });
          allFixtures.push(...items);
        } catch (e) {
          console.error(`Error fetching ${dateStr}:`, e.message);
        }
      }

      return res.status(200).json({ response: allFixtures });

    } else {
      // upcoming — dnešní zápasy
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${BASE}/fixtures?date=${today}`, { headers });
      const data = await response.json();
      return res.status(200).json(data);
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
