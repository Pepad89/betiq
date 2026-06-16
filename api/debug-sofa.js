export default async function handler(req, res) {
  const apiKey = process.env.RAPIDAPI_KEY;
  const HOST = 'sofascore.p.rapidapi.com';
  const headers = { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': HOST };

  const today = new Date().toISOString().split('T')[0];
  const results = {};

  const paths = [
    `sport/football/scheduled-events/${today}`,
    `sport/1/scheduled-events/${today}`,
    `sport/basketball/scheduled-events/${today}`,
    `sport/2/scheduled-events/${today}`,
    `sport/football/events/live`,
    `sport/1/events/live`,
    `sports/list`,
    `categories/list`,
  ];

  for (const path of paths) {
    try {
      const r = await fetch(`https://${HOST}/${path}`, { headers });
      const data = await r.json();
      results[path] = data.message || (data.events ? `OK events:${data.events.length}` : (data.sports ? `OK sports:${data.sports.length}` : JSON.stringify(data).slice(0,100)));
    } catch(e) {
      results[path] = `ERROR: ${e.message}`;
    }
  }

  return res.status(200).json(results);
}
