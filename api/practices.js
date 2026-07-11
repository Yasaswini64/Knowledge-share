import supabase from './db-client.js';

async function getProfileMap(userIds) {
  if (!userIds.length) return {};
  const { data } = await supabase.from('profiles').select('user_id, full_name').in('user_id', userIds);
  const map = {};
  (data || []).forEach((p) => {
    map[p.user_id] = p.full_name;
  });
  return map;
}

async function getCategoryMap() {
  const { data } = await supabase.from('categories').select('id, name');
  const map = {};
  (data || []).forEach((c) => {
    map[c.id] = c.name;
  });
  return map;
}

async function enrichPractices(practices, userId) {
  if (!practices?.length) return [];
  const catMap = await getCategoryMap();
  const profileMap = await getProfileMap([...new Set(practices.map((p) => p.contributor_id).filter(Boolean))]);

  let likedSet = new Set();
  let bookmarkedSet = new Set();
  if (userId) {
    const ids = practices.map((p) => p.id);
    const { data: likes } = await supabase.from('likes').select('practice_id').eq('user_id', userId).in('practice_id', ids);
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('practice_id')
      .eq('user_id', userId)
      .in('practice_id', ids);
    likedSet = new Set((likes || []).map((l) => l.practice_id));
    bookmarkedSet = new Set((bookmarks || []).map((b) => b.practice_id));
  }

  const { data: commentRows } = await supabase.from('comments').select('practice_id');
  const commentCounts = {};
  (commentRows || []).forEach((c) => {
    commentCounts[c.practice_id] = (commentCounts[c.practice_id] || 0) + 1;
  });

  return practices.map((p) => ({
    ...p,
    images: Array.isArray(p.images) ? p.images : p.images ? JSON.parse(p.images) : [],
    ai_keywords: Array.isArray(p.ai_keywords) ? p.ai_keywords : p.ai_keywords ? JSON.parse(p.ai_keywords) : [],
    category_name: catMap[p.category_id] || 'Uncategorized',
    contributor_name: profileMap[p.contributor_id] || 'Contributor',
    comments_count: commentCounts[p.id] || 0,
    liked: likedSet.has(p.id),
    bookmarked: bookmarkedSet.has(p.id),
  }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    let requesterId = null;
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const { data: authData } = await supabase.auth.getUser(token);
      requesterId = authData?.user?.id || null;
    }

    if (req.method === 'GET') {
      const {
        id,
        status,
        category_id,
        state,
        district,
        village,
        q,
        contributor_id,
        featured,
        sort = 'newest',
        limit,
        offset,
        mine,
      } = req.query;

      if (id) {
        const { data, error } = await supabase.from('practices').select('*').eq('id', Number(id)).maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Practice not found' });
        await supabase
          .from('practices')
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq('id', data.id);
        const [enriched] = await enrichPractices([{ ...data, views_count: (data.views_count || 0) + 1 }], requesterId);
        return res.status(200).json(enriched);
      }

      let query = supabase.from('practices').select('*');

      if (mine === 'true' && requesterId) {
        query = query.eq('contributor_id', requesterId);
      } else if (contributor_id) {
        query = query.eq('contributor_id', contributor_id);
      } else if (status) {
        query = query.eq('status', status);
      } else {
        query = query.eq('status', 'approved');
      }

      if (category_id) query = query.eq('category_id', Number(category_id));
      if (state) query = query.ilike('state', state);
      if (district) query = query.ilike('district', `%${district}%`);
      if (village) query = query.ilike('village', `%${village}%`);
      if (featured === 'true') query = query.eq('featured', true);
      if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,benefits.ilike.%${q}%`);

      if (sort === 'popular') query = query.order('likes_count', { ascending: false });
      else if (sort === 'views') query = query.order('views_count', { ascending: false });
      else query = query.order('created_at', { ascending: false });

      if (limit) {
        const from = Number(offset || 0);
        const to = from + Number(limit) - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;
      if (error) throw error;
      const enriched = await enrichPractices(data || [], requesterId);
      return res.status(200).json(enriched);
    }

    if (req.method === 'POST') {
      if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
      const body = req.body || {};
      const {
        title,
        description,
        category_id,
        state,
        district,
        village,
        benefits,
        modern_adaptation,
        images = [],
        audio_url,
        pdf_url,
        transcript,
        ai_summary,
        ai_keywords = [],
      } = body;

      if (!title || !description || !category_id) {
        return res.status(400).json({ error: 'title, description, and category_id are required' });
      }

      const { data, error } = await supabase
        .from('practices')
        .insert({
          title,
          description,
          category_id: Number(category_id),
          state: state || '',
          district: district || '',
          village: village || '',
          benefits: benefits || '',
          modern_adaptation: modern_adaptation || '',
          status: 'pending',
          contributor_id: requesterId,
          images,
          audio_url: audio_url || null,
          pdf_url: pdf_url || null,
          transcript: transcript || null,
          ai_summary: ai_summary || null,
          ai_keywords,
          likes_count: 0,
          views_count: 0,
          featured: false,
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: requesterId,
        title: 'Submission Received',
        message: `Your practice "${title}" has been submitted for expert review.`,
        type: 'submission',
        read: false,
        link: `/practices/${data.id}`,
      });

      const [enriched] = await enrichPractices([data], requesterId);
      return res.status(201).json(enriched);
    }

    if (req.method === 'PUT') {
      if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
      const body = req.body || {};
      const { id, ...rest } = body;
      if (!id) return res.status(400).json({ error: 'id required' });

      const { data: existing } = await supabase.from('practices').select('*').eq('id', id).maybeSingle();
      if (!existing) return res.status(404).json({ error: 'Not found' });

      const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', requesterId).maybeSingle();
      const isOwner = existing.contributor_id === requesterId;
      const isPrivileged = profile?.role === 'admin' || profile?.role === 'expert';
      if (!isOwner && !isPrivileged) return res.status(403).json({ error: 'Forbidden' });

      const allowed = [
        'title',
        'description',
        'category_id',
        'state',
        'district',
        'village',
        'benefits',
        'modern_adaptation',
        'images',
        'audio_url',
        'pdf_url',
        'transcript',
        'ai_summary',
        'ai_keywords',
        'featured',
        'status',
        'expert_comments',
        'validated_by',
      ];
      const updates = {};
      allowed.forEach((k) => {
        if (rest[k] !== undefined) updates[k] = rest[k];
      });
      if (updates.category_id) updates.category_id = Number(updates.category_id);
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase.from('practices').update(updates).eq('id', id).select().single();
      if (error) throw error;
      const [enriched] = await enrichPractices([data], requesterId);
      return res.status(200).json(enriched);
    }

    if (req.method === 'DELETE') {
      if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });

      const { data: existing } = await supabase.from('practices').select('*').eq('id', id).maybeSingle();
      if (!existing) return res.status(404).json({ error: 'Not found' });

      const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', requesterId).maybeSingle();
      if (existing.contributor_id !== requesterId && profile?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await supabase.from('comments').delete().eq('practice_id', id);
      await supabase.from('likes').delete().eq('practice_id', id);
      await supabase.from('bookmarks').delete().eq('practice_id', id);
      await supabase.from('validation_logs').delete().eq('practice_id', id);
      const { error } = await supabase.from('practices').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('practices API error:', err);
    res.status(500).json({ error: err.message });
  }
}
