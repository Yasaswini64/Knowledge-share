import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { apiGet } from '../lib/api';
import { PageLoader } from '../components/LoadingSkeleton';

interface StateCount {
  state: string;
  count: number;
}

// Approximate positions for a simplified India map board
const STATE_POS: Record<string, { x: number; y: number }> = {
  'Jammu and Kashmir': { x: 38, y: 8 },
  Ladakh: { x: 48, y: 6 },
  'Himachal Pradesh': { x: 42, y: 14 },
  Punjab: { x: 36, y: 18 },
  Uttarakhand: { x: 48, y: 18 },
  Haryana: { x: 38, y: 24 },
  Delhi: { x: 40, y: 26 },
  Rajasthan: { x: 28, y: 32 },
  'Uttar Pradesh': { x: 48, y: 30 },
  Bihar: { x: 62, y: 34 },
  Gujarat: { x: 18, y: 42 },
  'Madhya Pradesh': { x: 40, y: 42 },
  Chhattisgarh: { x: 50, y: 48 },
  Jharkhand: { x: 60, y: 42 },
  'West Bengal': { x: 68, y: 42 },
  Odisha: { x: 58, y: 52 },
  Maharashtra: { x: 32, y: 52 },
  Telangana: { x: 42, y: 58 },
  'Andhra Pradesh': { x: 46, y: 66 },
  Karnataka: { x: 34, y: 68 },
  Goa: { x: 26, y: 64 },
  Kerala: { x: 32, y: 82 },
  'Tamil Nadu': { x: 42, y: 80 },
  Assam: { x: 78, y: 30 },
  Meghalaya: { x: 76, y: 36 },
  Manipur: { x: 84, y: 36 },
  Mizoram: { x: 82, y: 42 },
  Tripura: { x: 78, y: 40 },
  Nagaland: { x: 84, y: 30 },
  Sikkim: { x: 70, y: 28 },
  'Arunachal Pradesh': { x: 86, y: 24 },
  Puducherry: { x: 48, y: 76 },
};

export default function MapPage() {
  const [data, setData] = useState<StateCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<StateCount | null>(null);

  useEffect(() => {
    apiGet<StateCount[]>('/api/map-data')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const max = Math.max(...data.map((d) => d.count), 1);
  const lookup = Object.fromEntries(data.map((d) => [d.state, d.count]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-stone-800 dark:text-stone-100">India Heritage Map</h1>
        <p className="text-sm text-stone-500">Interactive distribution of approved traditional practices by state</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card relative overflow-hidden rounded-3xl p-4 lg:col-span-2">
          <div className="relative mx-auto aspect-[4/5] max-w-xl rounded-2xl bg-gradient-to-br from-emerald-100 via-lime-50 to-amber-50 dark:from-emerald-950 dark:via-stone-900 dark:to-stone-950">
            <div className="absolute inset-6 rounded-[40%] border-2 border-dashed border-emerald-300/60 dark:border-emerald-700/50" />
            <div className="absolute inset-10 rounded-[45%] border border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/20" />
            {Object.entries(STATE_POS).map(([state, pos]) => {
              const count = lookup[state] || 0;
              const size = count ? 12 + (count / max) * 28 : 8;
              const opacity = count ? 0.45 + (count / max) * 0.55 : 0.2;
              return (
                <button
                  key={state}
                  title={`${state}: ${count}`}
                  onMouseEnter={() => setHover({ state, count })}
                  onMouseLeave={() => setHover(null)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600 shadow-lg shadow-emerald-700/30 transition hover:scale-110"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: size,
                    height: size,
                    opacity,
                  }}
                />
              );
            })}
            {hover && (
              <div className="absolute bottom-4 left-4 rounded-xl bg-white/95 px-3 py-2 text-sm shadow-lg dark:bg-stone-900/95">
                <p className="font-semibold text-stone-800 dark:text-stone-100">{hover.state}</p>
                <p className="text-emerald-700 dark:text-emerald-400">{hover.count} practices</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-stone-700 dark:text-stone-200">Top States</h2>
          {data.length === 0 && <p className="text-sm text-stone-500">No approved practices yet.</p>}
          {data.map((d) => (
            <Link
              key={d.state}
              to={`/feed?state=${encodeURIComponent(d.state)}`}
              className="glass-card flex items-center justify-between rounded-xl p-3 transition hover:ring-2 hover:ring-emerald-400"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-emerald-600" /> {d.state}
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                {d.count}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
