export default async function handler(req, res) {
  const { type, sport = 'football' } = req.query;

  // TheSportsDB — zdarma, bez API klíče, multi-sport
  const BASE = 'https://www.thesportsdb.com/api/v1/json/3';

  const sportMap = {
    football:           'Soccer',
    basketball:         'Basketball',
    tennis:             'Tennis',
    'ice-hockey':       'Ice_Hockey',
    baseball:           'Baseball',
    'american-football':'American_Football',
    volleyball:         'Volleyball',
  };

  const sportName = sportMap[sport] || 'Soccer';

  function formatDate(d) {
    return d.toISOString().split('T')[0];
  }

  try {
    if (type === 'live') {
      // TheSportsDB free tier — vrátíme dnešní zápasy (live endpoint není k dispozici zdarma)
      const today = formatDate(new Date());
      const r = await fetch(`${BASE}/eventsday.php?d=${today}&s=${sportName}`);
      const data = await r.json();
      const events = (data.events || []);
      // Seřaď: probíhající → nadcházející → ukončené
      const now = Date.now();
      const score = (ev) => {
        const status = ev.strStatus || '';
        if (status === 'Live') return 0;
        const t = ev.strTimestamp || ev.dateEvent || '';
        if (t) {
          const diff = (new Date(t).getTime() - now) / 60000; // minuty
          if (diff >= -120 && diff <= 120) return 0; // probíhající okno
        }
        const finished = status === 'Match Finished' || ev.intHomeScore !== null;
        return finished ? 2 : 1;
      };
      events.sort((a, b) => score(a) - score(b));
      return res.status(200).json({ events });

    } else if (type === 'future') {
      const all = [];
      for (let i = 1; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dateStr = formatDate(d);
        try {
          const r = await fetch(`${BASE}/eventsday.php?d=${dateStr}&s=${sportName}`);
          const data = await r.json();
          const items = data.events || [];
          items.forEach(item => { item._fetchDate = dateStr; });
          all.push(...items);
        } catch(e) {}
      }
      return res.status(200).json({ events: all });

    } else {
      // Dnešní zápasy
      const today = formatDate(new Date());
      const r = await fetch(`${BASE}/eventsday.php?d=${today}&s=${sportName}`);
      const data = await r.json();
      return res.status(200).json({ events: data.events || [] });
    }

  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
