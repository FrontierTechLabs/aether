export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { image, did } = req.body;
    if (!image) return res.status(400).json({ error: 'Missing image' });

    // For now, return the base64 image as a data URL (temporary fallback)
    // In production, upload to Supabase Storage and return the public URL.
    try {
        // Simple validation: if it's a data URL, return it directly for now.
        // In the next iteration, we'll upload to Supabase.
        res.status(200).json({ url: image });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
}
