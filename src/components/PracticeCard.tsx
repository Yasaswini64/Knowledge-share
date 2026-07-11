import { Link } from 'react-router-dom';
import { Heart, MapPin, MessageCircle, Bookmark } from 'lucide-react';
import type { Practice } from '../lib/types';
import { motion } from 'framer-motion';

export default function PracticeCard({ practice, index = 0 }: { practice: Practice; index?: number }) {
  const image =
    practice.images?.[0] ||
    'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=800';

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card group flex flex-col overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10"
    >
      <Link to={`/practices/${practice.id}`} className="relative block overflow-hidden">
        <img
          src={image}
          alt={practice.title}
          className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 backdrop-blur">
          {practice.category_name || 'Practice'}
        </span>
        {practice.featured && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-400/95 px-2.5 py-1 text-[11px] font-semibold text-amber-950">
            Featured
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
          {[practice.village, practice.district, practice.state].filter(Boolean).join(', ')}
        </div>
        <Link to={`/practices/${practice.id}`}>
          <h3 className="mb-2 line-clamp-2 font-display text-lg font-semibold text-stone-800 dark:text-stone-100">
            {practice.title}
          </h3>
        </Link>
        <p className="mb-4 line-clamp-2 flex-1 text-sm text-stone-600 dark:text-stone-400">
          {practice.description}
        </p>
        <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
          <span className="truncate font-medium text-stone-700 dark:text-stone-300">
            {practice.contributor_name || 'Contributor'}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 text-rose-500" /> {practice.likes_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" /> {practice.comments_count || 0}
            </span>
            {practice.bookmarked && <Bookmark className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
