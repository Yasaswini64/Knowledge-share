import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiGet, apiPut } from '../lib/api';
import type { Notification } from '../lib/types';
import { PageLoader } from '../components/LoadingSkeleton';

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet<Notification[]>('/api/notifications');
      setItems(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    try {
      await apiPut('/api/notifications', { read_all: true });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  };

  const markOne = async (id: number) => {
    try {
      await apiPut('/api/notifications', { id });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      /* ignore */
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold text-stone-800 dark:text-stone-100">
          <Bell className="h-7 w-7 text-emerald-600" /> Notifications
        </h1>
        <button onClick={markAll} className="btn-secondary inline-flex items-center gap-1 text-xs">
          <CheckCheck className="h-4 w-4" /> Mark all read
        </button>
      </div>

      <div className="space-y-3">
        {items.map((n) => (
          <div
            key={n.id}
            className={`glass-card rounded-2xl p-4 ${
              n.read ? 'opacity-70' : 'ring-1 ring-emerald-300/50 dark:ring-emerald-700/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-stone-800 dark:text-stone-100">{n.title}</p>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{n.message}</p>
                <p className="mt-2 text-xs text-stone-400">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.read && (
                <button onClick={() => markOne(n.id)} className="text-xs text-emerald-700 hover:underline">
                  Mark read
                </button>
              )}
            </div>
            {n.link && (
              <Link to={n.link} className="mt-2 inline-block text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                Open →
              </Link>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="glass-card rounded-2xl p-10 text-center text-stone-500">You're all caught up.</div>
        )}
      </div>
    </div>
  );
}
