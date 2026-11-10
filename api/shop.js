module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const headers = { Accept: 'application/json' };

  if (process.env.FORTNITE_API_KEY) {
    headers['x-api-key'] = process.env.FORTNITE_API_KEY;
  }

  try {
    const upstream = await fetch('https://fortnite-api.com/v2/shop', { headers });
    const payload = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      console.error('Fortnite API returned status', upstream.status, payload);
      return res.status(upstream.status).json({
        error: payload?.error || `Fortnite-API a répondu avec le statut ${upstream.status}.`
      });
    }

    const data = payload?.data || payload || {};
    const entries = Array.isArray(data.entries)
      ? data.entries
      : Array.isArray(data.shop)
        ? data.shop
        : Array.isArray(data.items)
          ? data.items
          : [];

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ data: entries });
  } catch (error) {
    console.error('Unable to reach Fortnite API:', error);
    return res.status(502).json({ error: 'Impossible de joindre Fortnite-API pour le moment.' });
  }
};
