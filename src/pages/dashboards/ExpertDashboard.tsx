import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Pencil, Loader2, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiGet, apiPost } from '../../lib/api';
import type { Practice } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';

export default function ExpertDashboard() {
  const { profile } = useAuth();
  const [pending, setPending] = useState<Practice[]>([]);
  const [selected, setSelected] = useState<Practice | null>(null);
  const [comments, setComments] = useState('');
  const [editForm, setEditForm] = useState({ title: '', description: '', benefits: '', modern_adaptation: '' });
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet<Practice[]>('/api/practices?status=pending');
      setPending(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openReview = (p: Practice) => {
    setSelected(p);
    setComments(p.expert_comments || '');
    setEditForm({
      title: p.title,
      description: p.description,
      benefits: p.benefits || '',
      modern_adaptation: p.modern_adaptation || '',
    });
  };

  const act = async (action: 'approve' | 'reject' | 'edit') => {
    if (!selected) return;
    setActing(true);
    try {
      await apiPost('/api/validation', {
        practice_id: selected.id,
        action,
        comments,
        updates: action === 'edit' || action === 'approve' ? editForm : undefined,
      });
      toast.success(
        action === 'approve' ? 'Practice approved' : action === 'reject' ? 'Practice rejected' : 'Updates saved'
      );
      if (action !== 'edit') {
        setSelected(null);
        load();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-stone-800 dark:text-stone-100">Expert Review</h1>
        <p className="text-sm text-stone-500">
          Hello {profile?.full_name}. Validate traditional practices with care.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="mb-3 font-semibold text-stone-700 dark:text-stone-200">
            Pending ({pending.length})
          </h2>
          {loading ? (
            <p className="text-stone-500">Loading…</p>
          ) : pending.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-stone-500">No pending submissions 🎉</div>
          ) : (
            <div className="space-y-3">
              {pending.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openReview(p)}
                  className={`glass-card w-full rounded-2xl p-4 text-left transition hover:ring-2 hover:ring-emerald-400 ${
                    selected?.id === p.id ? 'ring-2 ring-emerald-500' : ''
                  }`}
                >
                  <p className="font-semibold text-stone-800 dark:text-stone-100">{p.title}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {p.category_name} · {p.state} · {p.contributor_name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <div className="glass-card flex min-h-80 items-center justify-center rounded-3xl text-stone-500">
              Select a submission to review
            </div>
          ) : (
            <div className="glass-card space-y-4 rounded-3xl p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    {selected.category_name}
                  </p>
                  <h3 className="font-display text-2xl font-bold text-stone-800 dark:text-stone-50">{selected.title}</h3>
                  <p className="text-sm text-stone-500">
                    {[selected.village, selected.district, selected.state].filter(Boolean).join(', ')} · by{' '}
                    {selected.contributor_name}
                  </p>
                </div>
                <Link to={`/practices/${selected.id}`} className="btn-secondary inline-flex items-center gap-1 text-xs">
                  <Eye className="h-3.5 w-3.5" /> Open
                </Link>
              </div>

              {selected.images?.[0] && (
                <img src={selected.images[0]} alt="" className="h-48 w-full rounded-2xl object-cover" />
              )}
              {selected.audio_url && (
                <audio controls className="w-full" src={selected.audio_url}>
                  Audio not supported
                </audio>
              )}
              {selected.transcript && (
                <div className="rounded-xl bg-stone-50 p-3 text-sm dark:bg-stone-900">
                  <strong>Transcript:</strong> {selected.transcript}
                </div>
              )}

              <div className="grid gap-3">
                <input
                  className="input-field"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
                <textarea
                  className="input-field min-h-24"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
                <textarea
                  className="input-field min-h-16"
                  placeholder="Benefits"
                  value={editForm.benefits}
                  onChange={(e) => setEditForm({ ...editForm, benefits: e.target.value })}
                />
                <textarea
                  className="input-field min-h-16"
                  placeholder="Modern adaptation"
                  value={editForm.modern_adaptation}
                  onChange={(e) => setEditForm({ ...editForm, modern_adaptation: e.target.value })}
                />
                <textarea
                  className="input-field min-h-20"
                  placeholder="Validation comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  disabled={acting}
                  onClick={() => act('approve')}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve
                </button>
                <button
                  disabled={acting}
                  onClick={() => act('reject')}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </button>
                <button
                  disabled={acting}
                  onClick={() => act('edit')}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" /> Save Edits
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
