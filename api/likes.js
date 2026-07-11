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

    if (req.method === 'POST') {
      const { practice_id } = req.body || {};
      if (!practice_id) return res.status(400).json({ error: 'practice_id required' });

      const { data: existing } = await supabase
        .from('likes')
        .select('*')
        .eq('practice_id', practice_id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        await supabase.from('likes').delete().eq('id', existing.id);
        const { data: practice } = await supabase.from('practices').select('likes_count').eq('id', practice_id).single();
        const newCount = Math.max(0, (practice?.likes_count || 1) - 1);
        await supabase.from('practices').update({ likes_count: newCount }).eq('id', practice_id);
        return res.status(200).json({ liked: false, likes_count: newCount });
      }

      await supabase.from('likes').insert({ practice_id, user_id: userId });
      const { data: practice } = await supabase.from('practices').select('likes_count').eq('id', practice_id).single();
      const newCount = (practice?.likes_count || 0) + 1;
      await supabase.from('practices').update({ likes_count: newCount }).eq('id', practice_id);
      return res.status(200).json({ liked: true, likes_count: newCount });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('likes API error:', err);
    res.status(500).json({ error: err.message });
  }
}
