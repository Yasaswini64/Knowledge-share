import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authData?.user) return res.status(401).json({ error: 'Invalid token' });
    const userId = authData.user.id;

    if (req.method === 'GET') {
      const { data: bookmarks, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const ids = (bookmarks || []).map((b) => b.practice_id);
      if (!ids.length) return res.status(200).json([]);

      const { data: practices } = await supabase.from('practices').select('*').in('id', ids);
      return res.status(200).json(practices || []);
    }

    if (req.method === 'POST') {
      const { practice_id } = req.body || {};
      if (!practice_id) return res.status(400).json({ error: 'practice_id required' });

      const { data: existing } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('practice_id', practice_id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        await supabase.from('bookmarks').delete().eq('id', existing.id);
        return res.status(200).json({ bookmarked: false });
      }

      await supabase.from('bookmarks').insert({ practice_id, user_id: userId });
      return res.status(200).json({ bookmarked: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('bookmarks API error:', err);
    res.status(500).json({ error: err.message });
  }
}
