export default async function handler(req, res) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RAPIDAPI_KEY není nastaven' });

  const { type } = req.query; // 'live' nebo 'upcoming'

  try {
    let url;
    if (type === 'live') {
      url = 'https://free-api-live-football-data.p.rapidapi.com/football-current-live';
    } else {
      // today's fixtures
      const today = new Date().toISOString().split('T')[0];
      url = `https://free-api-live-football-data.p.rapidapi.com/football-get-all-fixtures-by-date?date=${today}`;
    }

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com',
      }
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
