export default async function handler(req, res) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RAPIDAPI_KEY není nastaven' });

  const HOST = 'free-api-live-football-data.p.rapidapi.com';
  const headers = {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': HOST,
  };

  // Formát data pro toto API: YYYYMMDD (bez pomlček)
  function toAPIDate(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  const { type } = req.query;

  try {
    if (type === 'live') {
      const response = await fetch(`https://${HOST}/football-current-live`, { headers });
      const data = await response.json();
      return res.status(200).json(data);

    } else if (type === 'future') {
      const allFixtures = [];
      const today = new Date();

      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = toAPIDate(date);
        try {
          const response = await fetch(`https://${HOST}/football-get-matches-by-date?date=${dateStr}`, { headers });
          const data = await response.json();
          const items = data.response?.matches || data.response?.live || [];
          if (Array.isArray(items)) {
            items.forEach(item => { item._fetchDate = date.toISOString().split('T')[0]; });
            allFixtures.push(...items);
          }
        } catch (e) {
          console.error(`Error fetching ${dateStr}:`, e.message);
        }
      }

      return res.status(200).json({ response: allFixtures });

    } else {
      // upcoming — dnešní zápasy
      const today = new Date();
      const dateStr = toAPIDate(today);
      const response = await fetch(`https://${HOST}/football-get-matches-by-date?date=${dateStr}`, { headers });
      const data = await response.json();
      return res.status(200).json(data);
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
