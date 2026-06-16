export default async function handler(req, res) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RAPIDAPI_KEY není nastaven' });

  const { type } = req.query; // 'live', 'upcoming', nebo 'future'

  try {
    if (type === 'live') {
      const url = 'https://free-api-live-football-data.p.rapidapi.com/football-current-live';
      const response = await fetch(url, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com',
        }
      });
      const data = await response.json();
      return res.status(200).json(data);

    } else if (type === 'future') {
      // Načti zápasy pro příštích 7 dní (zítra až +7 dní)
      const allFixtures = [];
      const today = new Date();

      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        try {
          const url = `https://free-api-live-football-data.p.rapidapi.com/football-get-all-fixtures-by-date?date=${dateStr}`;
          const response = await fetch(url, {
            headers: {
              'x-rapidapi-key': apiKey,
              'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com',
            }
          });
          const data = await response.json();
          // Přidej datum ke každému záznamu pro seskupování
          const items = data.response || data.data || data.matches || data.fixtures || data.livescores || [];
          if (Array.isArray(items)) {
            items.forEach(item => { item._fetchDate = dateStr; });
            allFixtures.push(...items);
          }
        } catch (dayErr) {
          // Pokud jeden den selže, pokračuj dál
          console.error(`Error fetching ${dateStr}:`, dayErr.message);
        }
      }

      return res.status(200).json({ response: allFixtures });

    } else {
      // upcoming — dnešní zápasy
      const today = new Date().toISOString().split('T')[0];
      const url = `https://free-api-live-football-data.p.rapidapi.com/football-get-all-fixtures-by-date?date=${today}`;
      const response = await fetch(url, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com',
        }
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
