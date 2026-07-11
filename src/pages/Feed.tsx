import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Mic, Search, X } from 'lucide-react';
import { apiGet } from '../lib/api';
import type { Category, Practice } from '../lib/types';
import { INDIAN_STATES } from '../lib/constants';
import PracticeCard from '../components/PracticeCard';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { useLanguage } from '../contexts/LanguageContext';

const PAGE_SIZE = 9;

export default function Feed() {
  const { tr } = useLanguage();
  const [params, setParams] = useSearchParams();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const offsetRef = useRef(0);

  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const state = params.get('state') || '';
  const district = params.get('district') || '';
  const village = params.get('village') || '';
  const sort = params.get('sort') || 'newest';

  const buildQuery = useCallback(
    (offset: number) => {
      const sp = new URLSearchParams();
      sp.set('status', 'approved');
      sp.set('limit', String(PAGE_SIZE));
      sp.set('offset', String(offset));
      if (q) sp.set('q', q);
      if (category) sp.set('category_id', category);
      if (state) sp.set('state', state);
      if (district) sp.set('district', district);
      if (village) sp.set('village', village);
      if (sort) sp.set('sort', sort);
      return `/api/practices?${sp.toString()}`;
    },
    [q, category, state, district, village, sort]
  );

  const load = useCallback(
    async (reset = true) => {
      if (reset) {
        setLoading(true);
        offsetRef.current = 0;
      } else {
        setLoadingMore(true);
      }
      try {
        const offset = reset ? 0 : offsetRef.current;
        const data = await apiGet<Practice[]>(buildQuery(offset));
        setPractices((prev) => (reset ? data : [...prev, ...data]));
        offsetRef.current = offset + data.length;
        setHasMore(data.length === PAGE_SIZE);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildQuery]
  );

  useEffect(() => {
    apiGet<Category[]>('/api/categories').then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    load(true);
  }, [load]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const startVoiceSearch = () => {
    const w = window as unknown as {
      webkitSpeechRecognition?: new () => {
        lang: string;
        onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
        start: () => void;
      };
      SpeechRecognition?: new () => {
        lang: string;
        onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
        start: () => void;
      };
    };
    const SR = w.webkitSpeechRecognition || w.SpeechRecognition;
    if (!SR) {
      alert('Voice search is not supported in this browser.');
      return;
    }
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.onresult = (event) => {
      const text = event.results[0][0].transcript;
      updateParam('q', text);
    };
    rec.start();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-stone-800 dark:text-stone-100">{tr('feed')}</h1>
          <p className="text-sm text-stone-500">Explore validated traditional sustainability practices</p>
        </div>
        <div className="flex flex-1 items-center gap-2 sm:max-w-md sm:justify-end">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              className="input-field pl-9 pr-10"
              placeholder={tr('search')}
              value={q}
              onChange={(e) => updateParam('q', e.target.value)}
            />
            <button
              type="button"
              onClick={startVoiceSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400"
              title="Voice search"
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-medium dark:border-stone-700 dark:bg-stone-900"
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="glass-card mb-6 grid gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-5">
          <select className="input-field" value={category} onChange={(e) => updateParam('category', e.target.value)}>
            <option value="">{tr('allCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select className="input-field" value={state} onChange={(e) => updateParam('state', e.target.value)}>
            <option value="">{tr('allStates')}</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            className="input-field"
            placeholder="District"
            value={district}
            onChange={(e) => updateParam('district', e.target.value)}
          />
          <input
            className="input-field"
            placeholder="Village"
            value={village}
            onChange={(e) => updateParam('village', e.target.value)}
          />
          <select className="input-field" value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
            <option value="newest">Newest</option>
            <option value="popular">Most Liked</option>
            <option value="views">Most Viewed</option>
          </select>
          {(q || category || state || district || village) && (
            <button
              className="inline-flex items-center gap-1 text-sm text-rose-600 sm:col-span-2 lg:col-span-5"
              onClick={() => setParams({})}
            >
              <X className="h-4 w-4" /> Clear filters
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : practices.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-stone-500">{tr('noResults')}</div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {practices.map((p, i) => (
              <PracticeCard key={p.id} practice={p} index={i % 9} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={() => load(false)}
                disabled={loadingMore}
                className="btn-secondary"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
