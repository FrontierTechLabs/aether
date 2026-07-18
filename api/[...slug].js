export default async function handler(req, res) {
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
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { raw: text.substring(0, 500), hint: 'Backend returned non-JSON' };
    }
    res.status(response.status).json({
      target: targetUrl,
      status: response.status,
      data
    });
  } catch (error) {
    res.status(500).json({ error: error.message, target: targetUrl });
  }
}
