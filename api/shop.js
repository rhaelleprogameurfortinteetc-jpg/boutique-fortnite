module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const headers = { Accept: 'application/json' };
  const key = process.env.FORTNITE_API_KEY;
  if (key) {
    headers['x-api-key'] = key;
  }

  const candidates = [
    'https://fortnite-api.com/v2/shop',
    'https://fortnite-api.com/v2/shop/combined',
    'https://fortnite-api.com/v2/shop/br'
  ];

  let lastStatus = 502;

  for (const endpoint of candidates) {
    try {
      const upstream = await fetch(endpoint, { headers });
      lastStatus = upstream.status;

      if (upstream.ok) {
        const payload = await upstream.json();
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        return res.status(200).json(payload);
      }

      const body = await upstream.json().catch(() => null);
      if (upstream.status === 404 || upstream.status === 410) {
        continue;
      }

      return res.status(upstream.status).json({
        error: upstream.status === 401 || upstream.status === 403
          ? 'Fortnite-API a refusé la requête. Vérifie la clé configurée dans Vercel.'
          : body?.error || `Le service Fortnite-API a répondu avec le statut ${upstream.status}.`
      });
    } catch (error) {
      console.error('Endpoint tenté sans succès:', endpoint, error);
    }
  }

  return res.status(lastStatus).json({
    error: 'Aucune route actuelle de boutique Fortnite n’a répondu correctement. Le site utilisait une ancienne route obsolète (410 Gone).'
  });
};
