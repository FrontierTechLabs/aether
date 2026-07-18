export default async function handler(req, res) {
  // Extract the API path from the URL
  const slug = req.query.slug || [];
  const path = Array.isArray(slug) ? slug.join('/') : '';
  if (!path) {
    return res.status(400).json({ error: 'Missing API path' });
  }

  // Build the target URL (using the exact path)
  const targetUrl = `https://indian-messenger-production-e288.up.railway.app/api/${path}`;

  // Prepare request options
  const options = {
    method: req.method,
    headers: {
      // Forward all original headers
      ...req.headers,
      // Override host to avoid mismatches
      host: 'indian-messenger-production-e288.up.railway.app',
    },
  };

  // Remove headers that might cause issues (like connection, content-length)
  delete options.headers['connection'];
  delete options.headers['content-length'];

  // For non-GET requests, forward the body
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

    // Return the exact status and data from the backend
    res.status(status).json(data);
  } catch (error) {
    // If fetch fails (network error, etc.)
    res.status(500).json({ error: 'Proxy fetch error: ' + error.message });
  }
}
