export default async function handler(req, res) {
  // Extract the API path after /api/ from the request URL
  const url = req.url; // e.g., "/api/posts?foo=bar"
  const match = url.match(/^\/api\/(.+?)(\?|$)/);
  if (!match) {
    return res.status(400).json({ error: 'Invalid API path' });
  }
  const path = match[1]; // e.g., "posts"
  const targetUrl = `https://indian-messenger-production-e288.up.railway.app/api/${path}`;

  // Prepare request options
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
    const status = response.status;
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { raw: text.substring(0, 500), hint: 'Backend returned non-JSON' };
    }
    res.status(status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy fetch error: ' + error.message });
  }
}
