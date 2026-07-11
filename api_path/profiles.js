import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id, role } = req.query;
      if (user_id) {
        const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user_id).maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Profile not found' });
        return res.status(200).json(data);
      }
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (role) query = query.eq('role', role);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { user_id, email, full_name, role = 'contributor', bio, state, avatar_url } = req.body || {};
      if (!user_id || !email) return res.status(400).json({ error: 'user_id and email required' });

      const { data: existing } = await supabase.from('profiles').select('*').eq('user_id', user_id).maybeSingle();
      if (existing) return res.status(200).json(existing);

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id,
          email,
          full_name: full_name || email.split('@')[0],
          role,
          bio: bio || '',
          state: state || '',
          avatar_url: avatar_url || null,
          badges: [],
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const { data: authData, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !authData?.user) return res.status(401).json({ error: 'Invalid token' });

      const { user_id, full_name, bio, state, avatar_url, role, badges } = req.body || {};
      if (!user_id) return res.status(400).json({ error: 'user_id required' });

      const { data: requester } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      const updates = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (bio !== undefined) updates.bio = bio;
      if (state !== undefined) updates.state = state;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;
      if (badges !== undefined) updates.badges = badges;
      if (role !== undefined) {
        if (requester?.role !== 'admin' && authData.user.id !== user_id) {
          return res.status(403).json({ error: 'Only admin can change roles' });
        }
        if (requester?.role === 'admin') updates.role = role;
      }

      const { data, error } = await supabase.from('profiles').update(updates).eq('user_id', user_id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('profiles API error:', err);
    res.status(500).json({ error: err.message });
  }
}
