module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const headers = { Accept: 'application/json' };
  // Configure FORTNITE_API_KEY in Vercel Project Settings > Environment Variables.
  // Never put this value in client-side HTML or commit it to GitHub.
  if (process.env.FORTNITE_API_KEY) {
    headers.Authorization = process.env.FORTNITE_API_KEY;
  }

  try {
    const upstream = await fetch('https://fortnite-api.com/v2/shop/br', { headers });
    const body = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      console.error('Fortnite API returned status', upstream.status);
      return res.status(upstream.status).json({
        error: upstream.status === 401 || upstream.status === 403
          ? 'Fortnite-API a refusé la requête. Vérifie la variable FORTNITE_API_KEY dans Vercel.'
          : `Le service Fortnite-API a répondu avec le statut ${upstream.status}.`
      });
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(body);
  } catch (error) {
    console.error('Unable to reach Fortnite API:', error);
    return res.status(502).json({ error: 'Impossible de joindre Fortnite-API pour le moment.' });
  }
};
