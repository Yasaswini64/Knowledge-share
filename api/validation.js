import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authData?.user) return res.status(401).json({ error: 'Invalid token' });
    const expertId = authData.user.id;

    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', expertId).maybeSingle();
    if (!profile || (profile.role !== 'expert' && profile.role !== 'admin')) {
      return res.status(403).json({ error: 'Expert or admin role required' });
    }

    if (req.method === 'GET') {
      const { practice_id } = req.query;
      let query = supabase.from('validation_logs').select('*').order('created_at', { ascending: false });
      if (practice_id) query = query.eq('practice_id', Number(practice_id));
      const { data, error } = await query;
      if (error) throw error;

      const expertIds = [...new Set((data || []).map((d) => d.expert_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', expertIds);
      const map = {};
      (profiles || []).forEach((p) => {
        map[p.user_id] = p.full_name;
      });

      return res.status(200).json(
        (data || []).map((d) => ({
          ...d,
          expert_name: map[d.expert_id] || 'Expert',
        }))
      );
    }

    if (req.method === 'POST') {
      const { practice_id, action, comments, updates } = req.body || {};
      if (!practice_id || !['approve', 'reject', 'edit'].includes(action)) {
        return res.status(400).json({ error: 'practice_id and valid action required' });
      }

      const { data: practice } = await supabase.from('practices').select('*').eq('id', practice_id).maybeSingle();
      if (!practice) return res.status(404).json({ error: 'Practice not found' });

      const previous_status = practice.status;
      let new_status = previous_status;
      const practiceUpdates = { ...(updates || {}), updated_at: new Date().toISOString() };

      if (action === 'approve') {
        new_status = 'approved';
        practiceUpdates.status = 'approved';
        practiceUpdates.validated_by = expertId;
        practiceUpdates.expert_comments = comments || practice.expert_comments || '';
      } else if (action === 'reject') {
        new_status = 'rejected';
        practiceUpdates.status = 'rejected';
        practiceUpdates.validated_by = expertId;
        practiceUpdates.expert_comments = comments || '';
      } else if (action === 'edit') {
        if (comments) practiceUpdates.expert_comments = comments;
      }

      const { data: updated, error: upErr } = await supabase
        .from('practices')
        .update(practiceUpdates)
        .eq('id', practice_id)
        .select()
        .single();
      if (upErr) throw upErr;

      const { data: log, error: logErr } = await supabase
        .from('validation_logs')
        .insert({
          practice_id,
          expert_id: expertId,
          action,
          comments: comments || '',
          previous_status,
          new_status,
        })
        .select()
        .single();
      if (logErr) throw logErr;

      if (action === 'approve' || action === 'reject') {
        await supabase.from('notifications').insert({
          user_id: practice.contributor_id,
          title: action === 'approve' ? 'Practice Approved' : 'Practice Rejected',
          message:
            action === 'approve'
              ? `Your practice "${practice.title}" has been approved by an expert.`
              : `Your practice "${practice.title}" was rejected. ${comments || ''}`,
          type: action === 'approve' ? 'approval' : 'rejection',
          read: false,
          link: `/practices/${practice_id}`,
        });
      } else if (comments) {
        await supabase.from('notifications').insert({
          user_id: practice.contributor_id,
          title: 'Expert Comment Added',
          message: `An expert commented on "${practice.title}": ${comments}`,
          type: 'comment',
          read: false,
          link: `/practices/${practice_id}`,
        });
      }

      return res.status(200).json({ practice: updated, log });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('validation API error:', err);
    res.status(500).json({ error: err.message });
  }
}
