import supabase from './db-client.js';

const CATEGORY_KEYWORDS = {
  'Rainwater Harvesting': ['rain', 'water', 'tank', 'well', 'johad', 'stepwell', 'baori', 'harvest'],
  'Organic Farming': ['organic', 'compost', 'manure', 'soil', 'fertilizer', 'farm', 'crop'],
  'Mixed Farming': ['mixed', 'livestock', 'crop', 'cattle', 'intercrop', 'agroforestry'],
  'Natural Pest Control': ['pest', 'insect', 'neem', 'repellent', 'biocontrol', 'trap'],
  'Herbal Medicine': ['herb', 'ayurveda', 'medicine', 'plant', 'healing', 'remedy', 'tulsi'],
  'Waste Management': ['waste', 'recycle', 'compost', 'dung', 'biogas', 'refuse'],
  'Renewable Energy': ['solar', 'wind', 'biogas', 'energy', 'fuel', 'chulha'],
  'Eco-Friendly Housing': ['mud', 'housing', 'bamboo', 'architecture', 'cool', 'home', 'building'],
  'Food Preservation': ['preserve', 'pickle', 'dry', 'ferment', 'storage', 'grain'],
  'Seed Preservation': ['seed', 'heirloom', 'bank', 'variety', 'germplasm', 'native'],
};

function extractKeywords(text) {
  const words = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const freq = {};
  words.forEach((w) => {
    freq[w] = (freq[w] || 0) + 1;
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);
}

function recommendCategory(text) {
  const lower = (text || '').toLowerCase();
  let best = 'Organic Farming';
  let bestScore = 0;
  Object.entries(CATEGORY_KEYWORDS).forEach(([cat, kws]) => {
    const score = kws.reduce((s, k) => s + (lower.includes(k) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  });
  return best;
}

function generateSummary(title, description, benefits) {
  const desc = (description || '').trim();
  const short = desc.length > 220 ? desc.slice(0, 220) + '…' : desc;
  const benefitBit = benefits ? ` Key benefits include ${benefits.split(/[.,]/)[0].trim()}.` : '';
  return `${title || 'This traditional practice'} is a community-rooted sustainability method. ${short}${benefitBit}`;
}

function suggestAdaptation(description, category) {
  const base =
    'Integrate community knowledge with modern monitoring tools, local cooperatives, and government sustainability schemes.';
  if ((description || '').toLowerCase().includes('water')) {
    return 'Combine traditional water-harvesting structures with IoT water-level sensors, GIS mapping, and municipal stormwater planning.';
  }
  if ((category || '').toLowerCase().includes('farm')) {
    return 'Pair traditional organic methods with soil-health testing, FPO market linkages, and climate-resilient crop calendars.';
  }
  if ((category || '').toLowerCase().includes('herb')) {
    return 'Document dosages scientifically, create community herb gardens, and link with AYUSH-certified practitioners.';
  }
  return base;
}

function mockTranscript(filename) {
  return `Transcribed oral knowledge from ${filename || 'audio'}: Elders describe seasonal water conservation, seed saving after harvest, and natural pest control using neem and ash. The practice is passed across generations through community gatherings and farm work.`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { action, title, description, benefits, category, audio_name, text } = req.body || {};
    const corpus = [title, description, benefits, text].filter(Boolean).join(' ');

    if (action === 'transcribe') {
      // Whisper API key not configured — provide structured offline transcription fallback
      const transcript = mockTranscript(audio_name);
      return res.status(200).json({
        transcript,
        provider: 'fallback',
        note: 'OpenAI Whisper key not configured. Using knowledge-aware transcript draft for review.',
      });
    }

    if (action === 'analyze') {
      const keywords = extractKeywords(corpus);
      const recommended_category = recommendCategory(corpus);
      const summary = generateSummary(title, description, benefits);
      const modern_adaptation = suggestAdaptation(description, category || recommended_category);

      // Optionally map category name to id
      let category_id = null;
      const { data: cats } = await supabase.from('categories').select('id, name');
      const match = (cats || []).find((c) => c.name.toLowerCase() === recommended_category.toLowerCase());
      if (match) category_id = match.id;

      return res.status(200).json({
        ai_summary: summary,
        ai_keywords: keywords,
        recommended_category,
        category_id,
        modern_adaptation,
        provider: 'rule-based',
      });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('ai API error:', err);
    res.status(500).json({ error: err.message });
  }
}
