import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
      if (error) throw error;

      const { data: practices } = await supabase.from('practices').select('category_id').eq('status', 'approved');
      const counts = {};
      (practices || []).forEach((p) => {
        counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      });

      const result = (data || []).map((c) => ({ ...c, practice_count: counts[c.id] || 0 }));
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const { name, slug, description, icon } = req.body || {};
      if (!name) return res.status(400).json({ error: 'name required' });
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
          description: description || '',
          icon: icon || 'Leaf',
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, name, slug, description, icon } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (slug !== undefined) updates.slug = slug;
      if (description !== undefined) updates.description = description;
      if (icon !== undefined) updates.icon = icon;
      const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('categories API error:', err);
    res.status(500).json({ error: err.message });
  }
}
