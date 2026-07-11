import { Link } from 'react-router-dom';
import { Leaf, Github, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Footer() {
  const { tr } = useLanguage();

  return (
    <footer className="mt-auto border-t border-emerald-900/10 bg-gradient-to-b from-emerald-950 to-stone-950 text-emerald-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
        <div>
          <div className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Leaf className="h-5 w-5 text-lime-400" />
            {tr('appName')}
          </div>
          <p className="text-sm leading-relaxed text-emerald-100/70">{tr('tagline')}</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-lime-300">Explore</h4>
          <ul className="space-y-2 text-sm text-emerald-100/80">
            <li><Link to="/feed" className="hover:text-white">Practices</Link></li>
            <li><Link to="/map" className="hover:text-white">India Map</Link></li>
            <li><Link to="/leaderboard" className="hover:text-white">Leaderboard</Link></li>
            <li><Link to="/register" className="hover:text-white">Become a Contributor</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-lime-300">Categories</h4>
          <ul className="space-y-2 text-sm text-emerald-100/80">
            <li>Rainwater Harvesting</li>
            <li>Organic Farming</li>
            <li>Herbal Medicine</li>
            <li>Seed Preservation</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-lime-300">Contact</h4>
          <ul className="space-y-2 text-sm text-emerald-100/80">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@sustainableheritage.in</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> India</li>
            <li className="flex items-center gap-2"><Github className="h-4 w-4" /> Open Knowledge</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-emerald-100/50">
        © {new Date().getFullYear()} Sustainable Heritage. Preserving traditional wisdom for a greener tomorrow.
      </div>
    </footer>
  );
}
