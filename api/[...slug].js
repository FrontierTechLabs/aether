export default async function handler(req, res) {
  // Get the full path after /api/
  const slug = req.query.slug ? req.query.slug.join('/') : '';
  const targetUrl = `https://indian-messenger-production-e288.up.railway.app/api/${slug}`;

  // Build the fetch options
  const options = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add body for non‑GET requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    options.body = JSON.stringify(req.body);
  }

  try {
    const response = await fetch(targetUrl, options);
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      // If not JSON, return error
      const text = await response.text();
      res.status(500).json({ error: 'Backend returned non-JSON: ' + text.substring(0, 100) });
    }
  } catch (error) {
    res.status(500).json({ error: 'Proxy error: ' + error.message });
  }
}
