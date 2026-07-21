const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// ----- Use Service Role Key if available (bypasses RLS) -----
const supabaseUrl = process.env.SUPABASE_URL || 'https://qedktepkjztappjgllpa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 SUPABASE_URL:', supabaseUrl ? 'Set' : 'MISSING');
console.log('🔍 Using key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role Key ✅' : 'Anon Key (may be blocked by RLS)');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ---------- Upload image to Supabase Storage ----------
async function uploadImage(did, base64Data) {
  const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid base64 image');
  const ext = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const fileName = `${did}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from('images')
    .upload(fileName, buffer, { contentType: `image/${ext}`, upsert: false });
  if (error) throw error;
  const { publicURL } = supabase.storage.from('images').getPublicUrl(fileName);
  return publicURL;
}

// ---------- User endpoints ----------
app.get('/api/user/:identifier', async (req, res) => {
  const identifier = req.params.identifier;
  try {
    let query = supabase.from('users').select('did, username');
    if (identifier.startsWith('did:mesh:')) {
      query = query.eq('did', identifier);
    } else {
      query = query.ilike('username', identifier);
    }
    const { data, error } = await query.single();
    if (error || !data) return res.status(404).json({ error: 'User not found' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/set-username', async (req, res) => {
  const { did, username } = req.body;
  if (!did || !username) return res.status(400).json({ error: 'Missing fields' });
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({ did, username })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Username taken' });
      console.error('Insert error:', error);
      throw error;
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Follow (simplified) ----------
app.post('/api/follow', (req, res) => res.json({ success: true }));
app.post('/api/unfollow', (req, res) => res.json({ success: true }));
app.get('/api/following/:did', (req, res) => res.json([]));

// ---------- Search ----------
app.get('/api/search', async (req, res) => {
  const q = req.query.q || '';
  try {
    const { data, error } = await supabase
      .from('users')
      .select('did, username')
      .ilike('username', `%${q}%`)
      .limit(20);
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Feed ----------
app.get('/api/feed', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Create post ----------
app.post('/api/posts', async (req, res) => {
  const { did, text, location, image, type } = req.body;
  if (!did) return res.status(401).json({ error: 'Missing did' });
  try {
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('username')
      .eq('did', did)
      .single();
    if (userErr || !user) return res.status(401).json({ error: 'Invalid user' });

    let imageUrl = null;
    if (image) {
      imageUrl = await uploadImage(did, image);
    }

    const postId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newPost = {
      id: postId,
      did,
      username: user.username,
      text: text || '',
      location: location || 'Earth',
      image_url: imageUrl,
      type: type || 'post',
      timestamp: Date.now(),
      likes: 0,
      comments: 0
    };

    const { data, error } = await supabase.from('posts').insert(newPost).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- Like / Unlike ----------
app.post('/api/like', async (req, res) => {
  const { postId, did } = req.body;
  try {
    const { data: existing, error: checkErr } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', postId)
      .eq('did', did)
      .maybeSingle();

    let liked = false;
    if (existing) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('did', did);
      await supabase.rpc('decrement_likes', { post_id: postId });
      liked = false;
    } else {
      await supabase.from('likes').insert({ post_id: postId, did });
      await supabase.rpc('increment_likes', { post_id: postId });
      liked = true;
    }

    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('likes')
      .eq('id', postId)
      .single();
    if (postErr) throw postErr;
    res.json({ likes: post.likes, liked });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Comment ----------
app.post('/api/comment', async (req, res) => {
  const { postId, did, text } = req.body;
  if (!text.trim()) return res.status(400).json({ error: 'Comment text required' });
  try {
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('username')
      .eq('did', did)
      .single();
    if (userErr || !user) return res.status(401).json({ error: 'Invalid user' });

    const comment = { post_id: postId, did, username: user.username, text, timestamp: Date.now() };
    await supabase.from('comments').insert(comment);
    await supabase.rpc('increment_comments', { post_id: postId });

    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('comments')
      .eq('id', postId)
      .single();
    if (postErr) throw postErr;
    res.json({ success: true, comment, comments: post.comments });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/comments/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('timestamp', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Serve static frontend ----------
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Satyam running on port ${PORT}`));
