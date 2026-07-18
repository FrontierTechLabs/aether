export default async function handler(req, res) {
  // Extract the API path from req.url
  const url = req.url;
  const match = url.match(/^\/api\/(.+?)(\?|$)/);
  if (!match) {
    return res.status(400).json({ error: 'Invalid API path' });
  }
  const path = match[1];
  const targetUrl = `https://indian-messenger-production-e288.up.railway.app/api/${path}`;

  const options = {
    method: req.method,
    headers: {
      ...req.headers,
      host: 'indian-messenger-production-e288.up.railway.app',
    },
  };
  delete options.headers['connection'];
  delete options.headers['content-length'];

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    options.body = JSON.stringify(req.body);
  }

  try {
    const response = await fetch(targetUrl, options);
    const data = await response.json();
    // Return exactly what the backend returns, without wrapping
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy error: ' + error.message });
  }
}
