import { useEffect, useState } from 'react';
import { Award, Medal, Trophy } from 'lucide-react';
import { apiGet } from '../lib/api';
import { PageLoader } from '../components/LoadingSkeleton';

interface LeaderRow {
  rank: number;
  user_id: string;
  full_name: string;
  state?: string;
  approved: number;
  likes: number;
  score: number;
  badges: string[];
}

export default function Leaderboard() {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<LeaderRow[]>('/api/leaderboard')
      .then(setRows)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const icon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-amber-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-stone-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <Award className="h-5 w-5 text-emerald-600" />;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-stone-800 dark:text-stone-100">Contributor Leaderboard</h1>
        <p className="mt-2 text-sm text-stone-500">Celebrating keepers of traditional sustainability knowledge</p>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <div
            key={r.user_id}
            className={`glass-card flex items-center gap-4 rounded-2xl p-4 ${
              r.rank <= 3 ? 'ring-1 ring-amber-300/60 dark:ring-amber-700/40' : ''
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
              {r.rank}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {icon(r.rank)}
                <p className="font-semibold text-stone-800 dark:text-stone-100">{r.full_name}</p>
              </div>
              <p className="text-xs text-stone-500">
                {r.state || 'India'} · {r.approved} approved · {r.likes} likes
              </p>
              {r.badges?.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.badges.map((b) => (
                    <span key={b} className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-medium text-lime-800 dark:bg-lime-900/40 dark:text-lime-200">
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-bold text-emerald-700 dark:text-emerald-400">{r.score}</p>
              <p className="text-[10px] uppercase tracking-wide text-stone-400">Score</p>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="glass-card rounded-2xl p-10 text-center text-stone-500">No contributors ranked yet.</div>
        )}
      </div>
    </div>
  );
}
