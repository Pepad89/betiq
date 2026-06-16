export default async function handler(req, res) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RAPIDAPI_KEY není nastaven' });

  const { type, sport = 'football', debug } = req.query;

  // ── FOOTBALL: původní API které funguje ──────────────────────────────────
  const FOOTBALL_HOST = 'free-api-live-football-data.p.rapidapi.com';
  const footballHeaders = { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': FOOTBALL_HOST };
  function toAPIDate(date) { return date.toISOString().split('T')[0].replace(/-/g, ''); }

  // ── SOFASCORE: pro ostatní sporty ────────────────────────────────────────
  const SOFA_HOST = 'sofascore.p.rapidapi.com';
  const sofaHeaders = { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': SOFA_HOST };

  // Sofascore sport ID mapping
  const sofaSportId = { basketball: 2, tennis: 5, 'ice-hockey': 4, baseball: 64, 'american-football': 63, volleyball: 23 };

  try {
    // ── FOOTBALL ─────────────────────────────────────────────────────────────
    if (sport === 'football') {
      if (type === 'live') {
        const r = await fetch(`https://${FOOTBALL_HOST}/football-current-live`, { headers: footballHeaders });
        return res.status(200).json(await r.json());
      } else if (type === 'future') {
        const all = [];
        const today = new Date();
        for (let i = 1; i <= 7; i++) {
          const d = new Date(today); d.setDate(today.getDate() + i);
          const dateStr = toAPIDate(d);
          const isoDate = d.toISOString().split('T')[0];
          try {
            const r = await fetch(`https://${FOOTBALL_HOST}/football-get-matches-by-date?date=${dateStr}`, { headers: footballHeaders });
            const data = await r.json();
            const items = data.response?.matches || data.response?.live || [];
            items.forEach(item => { item._fetchDate = isoDate; });
            all.push(...items);
          } catch(e) {}
        }
        return res.status(200).json({ response: { matches: all } });
      } else {
        const dateStr = toAPIDate(new Date());
        const r = await fetch(`https://${FOOTBALL_HOST}/football-get-matches-by-date?date=${dateStr}`, { headers: footballHeaders });
        return res.status(200).json(await r.json());
      }
    }

    // ── OSTATNÍ SPORTY přes Sofascore ────────────────────────────────────────
    const sportId = sofaSportId[sport];
    if (!sportId) return res.status(400).json({ error: `Nepodporovaný sport: ${sport}` });

    if (type === 'live') {
      // Sofascore live: /api/v1/sport/{id}/events/live
      const paths = [
        `https://${SOFA_HOST}/api/v1/sport/${sportId}/events/live`,
        `https://${SOFA_HOST}/sport/${sportId}/events/live`,
        `https://${SOFA_HOST}/categories/list-live`,
      ];
      for (const url of paths) {
        const r = await fetch(url, { headers: sofaHeaders });
        const data = await r.json();
        if (!data.message) return res.status(200).json(data);
      }
      return res.status(200).json({ events: [] });

    } else {
      // Sofascore scheduled: různé varianty cesty
      const all = [];
      const days = type === 'future' ? 7 : 1;
      const start = type === 'future' ? 1 : 0;

      for (let i = start; i < start + days; i++) {
        const d = new Date(); d.setDate(d.getDate() + i);
        const isoDate = d.toISOString().split('T')[0];
        const paths = [
          `https://${SOFA_HOST}/api/v1/sport/${sportId}/scheduled-events/${isoDate}`,
          `https://${SOFA_HOST}/sport/${sportId}/scheduled-events/${isoDate}`,
          `https://${SOFA_HOST}/api/v1/sport/${sport}/scheduled-events/${isoDate}`,
          `https://${SOFA_HOST}/sport/${sport}/scheduled-events/${isoDate}`,
        ];
        for (const url of paths) {
          try {
            const r = await fetch(url, { headers: sofaHeaders });
            const data = await r.json();
            if (!data.message && (data.events || data.data)) {
              const items = data.events || data.data || [];
              items.forEach(item => { item._fetchDate = isoDate; item._sofascore = true; });
              all.push(...items);
              break;
            }
          } catch(e) {}
        }
      }
      return res.status(200).json({ events: all });
    }

  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
