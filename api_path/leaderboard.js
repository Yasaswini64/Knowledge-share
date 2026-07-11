import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { data: practices } = await supabase.from('practices').select('contributor_id, likes_count, status');
    const { data: profiles } = await supabase.from('profiles').select('*');

    const stats = {};
    (practices || []).forEach((p) => {
      if (!stats[p.contributor_id]) {
        stats[p.contributor_id] = { total: 0, approved: 0, likes: 0 };
      }
      stats[p.contributor_id].total += 1;
      if (p.status === 'approved') {
        stats[p.contributor_id].approved += 1;
        stats[p.contributor_id].likes += p.likes_count || 0;
      }
    });

    const board = (profiles || [])
      .map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        state: p.state,
        role: p.role,
        badges: p.badges || [],
        total: stats[p.user_id]?.total || 0,
        approved: stats[p.user_id]?.approved || 0,
        likes: stats[p.user_id]?.likes || 0,
        score: (stats[p.user_id]?.approved || 0) * 10 + (stats[p.user_id]?.likes || 0),
      }))
      .filter((p) => p.total > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((p, i) => ({ ...p, rank: i + 1 }));

    return res.status(200).json(board);
  } catch (err) {
    console.error('leaderboard API error:', err);
    res.status(500).json({ error: err.message });
  }
}
