export default async function handler(req, res) {
  // Extract the API path from the query
  const slug = req.query.slug || [];
  const path = Array.isArray(slug) ? slug.join('/') : '';
  if (!path) {
    return res.status(400).json({ error: 'Missing API path' });
  }
  const targetUrl = `https://indian-messenger-production-e288.up.railway.app/api/${path}`;

  const options = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    options.body = JSON.stringify(req.body);
  }

  try {
    const response = await fetch(targetUrl, options);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error: ' + error.message });
  }
}
