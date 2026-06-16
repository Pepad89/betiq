export default async function handler(req, res) {
  const { q, teamId } = req.query;
  const BASE = 'https://www.thesportsdb.com/api/v1/json/3';

  try {
    if (teamId) {
      // Načti nadcházející a poslední zápasy týmu
      const [next, last] = await Promise.all([
        fetch(`${BASE}/eventsnext.php?id=${teamId}`).then(r=>r.json()),
        fetch(`${BASE}/eventslast.php?id=${teamId}`).then(r=>r.json()),
      ]);
      const events = [...(next.events||[]), ...(last.results||[])];
      return res.status(200).json({ events });
    }

    if (q) {
      // Hledej týmy a hráče
      const [teams, players] = await Promise.all([
        fetch(`${BASE}/searchteams.php?t=${encodeURIComponent(q)}`).then(r=>r.json()),
        fetch(`${BASE}/searchplayers.php?p=${encodeURIComponent(q)}`).then(r=>r.json()),
      ]);

      const results = [];

      (teams.teams || []).slice(0, 5).forEach(t => results.push({
        id: t.idTeam,
        name: t.strTeam,
        sport: t.strSport,
        country: t.strCountry,
        type: 'team'
      }));

      (players.player || []).slice(0, 3).forEach(p => results.push({
        id: p.idTeam, // hledáme zápasy jejich týmu
        name: p.strPlayer + ' (' + (p.strTeam||'') + ')',
        sport: p.strSport,
        country: p.strNationality,
        type: 'player'
      }));

      return res.status(200).json({ results });
    }

    return res.status(400).json({ error: 'Missing q or teamId' });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
