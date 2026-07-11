import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Leaf,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Globe,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LANG_LABELS, type Lang } from '../lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { dark, toggle } = useTheme();
  const { lang, setLang, tr } = useLanguage();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: '/', label: tr('home') },
    { to: '/feed', label: tr('feed') },
    { to: '/map', label: tr('map') },
    { to: '/leaderboard', label: tr('leaderboard') },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-900/10 bg-white/70 backdrop-blur-xl dark:border-emerald-100/10 dark:bg-stone-950/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-emerald-800 dark:text-emerald-300">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-lime-600 text-white shadow-lg shadow-emerald-500/20">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">{tr('appName')}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                    : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
              aria-label="Language"
            >
              <Globe className="h-5 w-5" />
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 mt-2 w-36 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-900"
                >
                  {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        setLang(l);
                        setLangOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm ${
                        lang === l
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-800'
                      }`}
                    >
                      {LANG_LABELS[l]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={toggle}
            className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {user ? (
            <>
              <Link
                to="/notifications"
                className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <Link
                to="/dashboard"
                className="hidden items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 sm:flex"
              >
                <LayoutDashboard className="h-4 w-4" />
                {tr('dashboard')}
              </Link>
              <div className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-2 py-1 dark:border-stone-700 dark:bg-stone-900/80 md:flex">
                <UserIcon className="h-4 w-4 text-emerald-600" />
                <span className="max-w-[100px] truncate text-xs font-medium text-stone-700 dark:text-stone-200">
                  {profile?.full_name || 'User'}
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  {profile?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                title={tr('logout')}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/30 sm:inline"
              >
                {tr('login')}
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
              >
                {tr('register')}
              </Link>
            </>
          )}

          <button
            className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-stone-200 md:hidden dark:border-stone-800"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  {l.label}
                </NavLink>
              ))}
              {user && (
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300"
                >
                  {tr('dashboard')}
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
