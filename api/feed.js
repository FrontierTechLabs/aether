export default async function handler(req, res) {
  const targetUrl = `https://indian-messenger-production-e288.up.railway.app/api/feed`;
  try {
    const response = await fetch(targetUrl);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy error' });
  }
}
