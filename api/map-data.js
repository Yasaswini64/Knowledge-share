import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { data, error } = await supabase.from('practices').select('state, status').eq('status', 'approved');
    if (error) throw error;

    const map = {};
    (data || []).forEach((p) => {
      const s = p.state || 'Unknown';
      map[s] = (map[s] || 0) + 1;
    });

    const result = Object.entries(map)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);

    return res.status(200).json(result);
  } catch (err) {
    console.error('map-data API error:', err);
    res.status(500).json({ error: err.message });
  }
}
