import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { public: isPublic } = req.query;

    const { data: practices } = await supabase.from('practices').select('*');
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: categories } = await supabase.from('categories').select('*');
    const { data: logs } = await supabase.from('validation_logs').select('*');

    const allPractices = practices || [];
    const allProfiles = profiles || [];
    const allCategories = categories || [];
    const allLogs = logs || [];

    if (isPublic === 'true') {
      const approved = allPractices.filter((p) => p.status === 'approved');
      const states = new Set(approved.map((p) => p.state).filter(Boolean));
      return res.status(200).json({
        contributors: allProfiles.filter((p) => p.role === 'contributor' || p.role === 'expert' || p.role === 'admin').length,
        practices: approved.length,
        experts: allProfiles.filter((p) => p.role === 'expert').length,
        states: states.size,
      });
    }

    const approved = allPractices.filter((p) => p.status === 'approved');
    const pending = allPractices.filter((p) => p.status === 'pending');
    const rejected = allPractices.filter((p) => p.status === 'rejected');

    const stateMap = {};
    approved.forEach((p) => {
      const s = p.state || 'Unknown';
      stateMap[s] = (stateMap[s] || 0) + 1;
    });
    const state_distribution = Object.entries(stateMap)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);

    const catMap = {};
    allCategories.forEach((c) => {
      catMap[c.id] = c.name;
    });
    const catCount = {};
    approved.forEach((p) => {
      const name = catMap[p.category_id] || 'Other';
      catCount[name] = (catCount[name] || 0) + 1;
    });
    const category_distribution = Object.entries(catCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const monthMap = {};
    allPractices.forEach((p) => {
      if (!p.created_at) return;
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
    });
    const monthly_uploads = Object.entries(monthMap)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    const expertMap = {};
    allLogs.forEach((l) => {
      if (!expertMap[l.expert_id]) expertMap[l.expert_id] = { approved: 0, rejected: 0 };
      if (l.action === 'approve') expertMap[l.expert_id].approved += 1;
      if (l.action === 'reject') expertMap[l.expert_id].rejected += 1;
    });
    const expertIds = Object.keys(expertMap);
    const expertProfiles = allProfiles.filter((p) => expertIds.includes(p.user_id));
    const expertNameMap = {};
    expertProfiles.forEach((p) => {
      expertNameMap[p.user_id] = p.full_name;
    });
    const expert_stats = expertIds.map((id) => ({
      expert: expertNameMap[id] || id.slice(0, 8),
      approved: expertMap[id].approved,
      rejected: expertMap[id].rejected,
    }));

    const contributorIds = new Set(allPractices.map((p) => p.contributor_id));

    return res.status(200).json({
      total_practices: allPractices.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      active_contributors: contributorIds.size,
      total_experts: allProfiles.filter((p) => p.role === 'expert').length,
      total_users: allProfiles.length,
      state_distribution,
      category_distribution,
      monthly_uploads,
      expert_stats,
    });
  } catch (err) {
    console.error('analytics API error:', err);
    res.status(500).json({ error: err.message });
  }
}
