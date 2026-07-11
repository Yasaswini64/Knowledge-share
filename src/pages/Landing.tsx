import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Users,
  Leaf,
  Award,
  MapPin,
  Sparkles,
  Droplets,
  Sprout,
  Recycle,
  Sun,
  Home,
  Bug,
  Apple,
  Wheat,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { apiGet } from '../lib/api';
import type { Category, Practice, PublicStats } from '../lib/types';
import PracticeCard from '../components/PracticeCard';
import { CardSkeleton } from '../components/LoadingSkeleton';

const testimonials = [
  {
    name: 'Lakshmi Devi',
    role: 'Farmer, Tamil Nadu',
    quote:
      'Documenting our traditional seed banks helped the next generation understand why local varieties matter.',
  },
  {
    name: 'Dr. Arjun Mehta',
    role: 'Sustainability Expert',
    quote:
      'This platform bridges ancestral knowledge with scientific validation — exactly what climate resilience needs.',
  },
  {
    name: 'Ramesh Patel',
    role: 'Contributor, Gujarat',
    quote:
      'Our village johad techniques are finally visible to planners and students across India.',
  },
];

const iconMap: Record<string, React.ElementType> = {
  Droplets,
  Sprout,
  Wheat,
  Bug,
  Leaf,
  Recycle,
  Sun,
  Home,
  Apple,
  Seedling: Sprout,
};

export default function Landing() {
  const { tr } = useLanguage();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [featured, setFeatured] = useState<Practice[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, f, c] = await Promise.all([
          apiGet<PublicStats>('/api/analytics?public=true'),
          apiGet<Practice[]>('/api/practices?featured=true&limit=3'),
          apiGet<Category[]>('/api/categories'),
        ]);
        setStats(s);
        setFeatured(f.length ? f : await apiGet<Practice[]>('/api/practices?limit=3'));
        setCategories(c.slice(0, 8));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-green-800 to-lime-700" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'url(https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=1600)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-900/40 to-transparent" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-lime-100 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Traditional Knowledge · Modern Platform
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              {tr('appName')}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-emerald-50/90">{tr('tagline')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/feed"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-800 shadow-lg shadow-black/20 transition hover:bg-lime-50"
              >
                {tr('explore')} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                {tr('contribute')}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="relative hidden lg:block"
          >
            <div className="glass-card absolute right-0 top-8 rounded-3xl p-5 text-white shadow-2xl">
              <p className="text-sm text-emerald-100">Living Heritage Archive</p>
              <p className="mt-2 font-display text-3xl font-bold">{stats?.practices ?? '—'} Practices</p>
              <p className="mt-1 text-xs text-emerald-100/80">Validated across Indian states</p>
            </div>
            <div className="glass-card absolute bottom-4 left-4 rounded-3xl p-5 text-white shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-lime-400/20 p-3">
                  <Leaf className="h-6 w-6 text-lime-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Expert Validated</p>
                  <p className="text-xs text-emerald-100/80">Community + science together</p>
                </div>
              </div>
            </div>
            <img
              src="https://images.pexels.com/photos/2886937/pexels-photo-2886937.jpeg?auto=compress&cs=tinysrgb&w=900"
              alt="Traditional Indian farming"
              className="h-[420px] w-full rounded-3xl object-cover shadow-2xl ring-1 ring-white/20"
            />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="mb-8 text-center font-display text-2xl font-bold text-stone-800 dark:text-stone-100 sm:text-3xl">
          {tr('stats')}
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Users, label: 'Contributors', value: stats?.contributors },
            { icon: Leaf, label: 'Practices', value: stats?.practices },
            { icon: Award, label: 'Experts', value: stats?.experts },
            { icon: MapPin, label: 'States', value: stats?.states },
          ].map((item) => (
            <div key={item.label} className="glass-card rounded-2xl p-5 text-center">
              <item.icon className="mx-auto mb-2 h-7 w-7 text-emerald-600" />
              <p className="font-display text-3xl font-bold text-stone-800 dark:text-white">{item.value ?? '—'}</p>
              <p className="text-sm text-stone-500 dark:text-stone-400">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="bg-gradient-to-b from-emerald-50/80 to-transparent py-14 dark:from-emerald-950/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold text-stone-800 dark:text-stone-100 sm:text-3xl">
              {tr('featured')}
            </h2>
            <Link to="/feed" className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p, i) => (
                <PracticeCard key={p.id} practice={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="mb-8 text-center font-display text-2xl font-bold text-stone-800 dark:text-stone-100 sm:text-3xl">
          {tr('categories')}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => {
            const Icon = iconMap[c.icon] || Leaf;
            return (
              <Link
                key={c.id}
                to={`/feed?category=${c.id}`}
                className="glass-card group rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-emerald-300 dark:hover:border-emerald-700"
              >
                <div className="mb-3 inline-flex rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-stone-800 dark:text-stone-100">{c.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-stone-500 dark:text-stone-400">{c.description}</p>
                <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {c.practice_count || 0} practices
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-emerald-900/5 bg-stone-50 py-14 dark:border-white/5 dark:bg-stone-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-8 text-center font-display text-2xl font-bold text-stone-800 dark:text-stone-100 sm:text-3xl">
            {tr('testimonials')}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="glass-card rounded-2xl p-6">
                <p className="mb-4 text-sm leading-relaxed text-stone-600 dark:text-stone-300">"{t.quote}"</p>
                <p className="font-semibold text-stone-800 dark:text-stone-100">{t.name}</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-green-700 to-lime-600 px-8 py-12 text-center text-white shadow-xl">
          <h2 className="font-display text-3xl font-bold">Share a Practice from Your Community</h2>
          <p className="mx-auto mt-3 max-w-2xl text-emerald-50/90">
            Upload stories, photos, and oral knowledge. Experts validate and the nation learns.
          </p>
          <Link
            to="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-800 shadow-lg hover:bg-lime-50"
          >
            Start Contributing <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
