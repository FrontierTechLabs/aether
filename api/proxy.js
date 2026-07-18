export default async function handler(req, res) {
  // Forward the request to the Railway backend
  const targetUrl = 'https://indian-messenger-production-e288.up.railway.app' + req.url;
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy error: ' + error.message });
  }
}
