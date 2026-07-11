import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { practice_id } = req.query;
      if (!practice_id) return res.status(400).json({ error: 'practice_id required' });
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('practice_id', Number(practice_id))
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((data || []).map((c) => c.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', userIds);
      const map = {};
      (profiles || []).forEach((p) => {
        map[p.user_id] = p.full_name;
      });

      return res.status(200).json(
        (data || []).map((c) => ({
          ...c,
          user_name: map[c.user_id] || 'User',
        }))
      );
    }

    if (req.method === 'POST') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const { data: authData, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !authData?.user) return res.status(401).json({ error: 'Invalid token' });

      const { practice_id, content } = req.body || {};
      if (!practice_id || !content?.trim()) return res.status(400).json({ error: 'practice_id and content required' });

      const { data, error } = await supabase
        .from('comments')
        .insert({
          practice_id: Number(practice_id),
          user_id: authData.user.id,
          content: content.trim(),
        })
        .select()
        .single();
      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      return res.status(201).json({ ...data, user_name: profile?.full_name || 'User' });
    }

    if (req.method === 'DELETE') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const { data: authData, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !authData?.user) return res.status(401).json({ error: 'Invalid token' });

      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });

      const { data: comment } = await supabase.from('comments').select('*').eq('id', id).maybeSingle();
      if (!comment) return res.status(404).json({ error: 'Not found' });

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (comment.user_id !== authData.user.id && profile?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('comments API error:', err);
    res.status(500).json({ error: err.message });
  }
}
