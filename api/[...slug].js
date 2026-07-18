export default async function handler(req, res) {
  // Get the full path after /api/
  const slug = req.query.slug ? req.query.slug.join('/') : '';
  const targetUrl = `https://indian-messenger-production-e288.up.railway.app/api/${slug}`;

  // Build the fetch options
  const options = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      // Forward important headers
      ...(req.headers.authorization && { Authorization: req.headers.authorization }),
    },
  };

  // Add body for non‑GET requests
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
