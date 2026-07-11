import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  FileAudio,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Loader2,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { apiGet, apiPost, apiDelete, fileToBase64 } from '../../lib/api';
import type { Category, Practice } from '../../lib/types';
import { INDIAN_STATES } from '../../lib/constants';
import { useAuth } from '../../contexts/AuthContext';

const emptyForm = {
  title: '',
  description: '',
  category_id: '',
  state: '',
  district: '',
  village: '',
  benefits: '',
  modern_adaptation: '',
  images: [] as string[],
  audio_url: '',
  pdf_url: '',
  transcript: '',
  ai_summary: '',
  ai_keywords: [] as string[],
};

export default function ContributorDashboard() {
  const { profile } = useAuth();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        apiGet<Practice[]>('/api/practices?mine=true'),
        apiGet<Category[]>('/api/categories'),
      ]);
      setPractices(p);
      setCategories(c);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fileBase64 = await fileToBase64(file);
      const res = await apiPost<{ url: string }>('/api/upload', {
        fileName: file.name,
        fileBase64,
        contentType: file.type,
      });
      return res.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadFile(file);
      if (url) urls.push(url);
    }
    setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
  };

  const handleAudio = async (file: File | null) => {
    if (!file) return;
    const url = await uploadFile(file);
    if (!url) return;
    setForm((f) => ({ ...f, audio_url: url }));
    try {
      const tr = await apiPost<{ transcript: string; note?: string }>('/api/ai', {
        action: 'transcribe',
        audio_name: file.name,
      });
      setForm((f) => ({ ...f, transcript: tr.transcript }));
      toast.info(tr.note || 'Transcript generated');
    } catch {
      toast.warning('Audio uploaded; transcript unavailable');
    }
  };

  const handlePdf = async (file: File | null) => {
    if (!file) return;
    const url = await uploadFile(file);
    if (url) setForm((f) => ({ ...f, pdf_url: url }));
  };

  const runAi = async () => {
    setAiLoading(true);
    try {
      const res = await apiPost<{
        ai_summary: string;
        ai_keywords: string[];
        modern_adaptation: string;
        category_id: number | null;
        recommended_category: string;
      }>('/api/ai', {
        action: 'analyze',
        title: form.title,
        description: form.description,
        benefits: form.benefits,
        category: categories.find((c) => String(c.id) === form.category_id)?.name,
      });
      setForm((f) => ({
        ...f,
        ai_summary: res.ai_summary,
        ai_keywords: res.ai_keywords,
        modern_adaptation: f.modern_adaptation || res.modern_adaptation,
        category_id: f.category_id || (res.category_id ? String(res.category_id) : ''),
      }));
      toast.success(`AI suggested category: ${res.recommended_category}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI failed');
    } finally {
      setAiLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category_id) {
      toast.error('Title, description and category are required');
      return;
    }
    setSubmitting(true);
    try {
      await apiPost('/api/practices', {
        ...form,
        category_id: Number(form.category_id),
      });
      toast.success('Practice submitted for review');
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this submission?')) return;
    try {
      await apiDelete('/api/practices', { id });
      toast.success('Deleted');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const filtered = practices.filter((p) => (filter === 'all' ? true : p.status === filter));
  const counts = {
    pending: practices.filter((p) => p.status === 'pending').length,
    approved: practices.filter((p) => p.status === 'approved').length,
    rejected: practices.filter((p) => p.status === 'rejected').length,
  };

  const statusIcon = (s: string) => {
    if (s === 'approved') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    if (s === 'rejected') return <XCircle className="h-4 w-4 text-rose-500" />;
    return <Clock className="h-4 w-4 text-amber-500" />;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-stone-800 dark:text-stone-100">Contributor Dashboard</h1>
          <p className="text-sm text-stone-500">Welcome, {profile?.full_name}. Share traditional knowledge.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Submit Practice
        </button>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        {(['pending', 'approved', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`glass-card rounded-2xl p-4 text-left transition ${
              filter === s ? 'ring-2 ring-emerald-500' : ''
            }`}
          >
            <p className="text-2xl font-bold text-stone-800 dark:text-white">{counts[s]}</p>
            <p className="text-xs capitalize text-stone-500">{s}</p>
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={submit} className="glass-card mb-8 space-y-4 rounded-3xl p-6">
          <h2 className="font-display text-xl font-semibold">New Practice Submission</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="input-field md:col-span-2"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <select
              className="input-field"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              required
            >
              <option value="">Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select className="input-field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
              <option value="">State</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              className="input-field"
              placeholder="District"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Village"
              value={form.village}
              onChange={(e) => setForm({ ...form, village: e.target.value })}
            />
          </div>
          <textarea
            className="input-field min-h-28"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <textarea
            className="input-field min-h-20"
            placeholder="Benefits"
            value={form.benefits}
            onChange={(e) => setForm({ ...form, benefits: e.target.value })}
          />
          <textarea
            className="input-field min-h-20"
            placeholder="Modern adaptation"
            value={form.modern_adaptation}
            onChange={(e) => setForm({ ...form, modern_adaptation: e.target.value })}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="glass-card flex cursor-pointer flex-col items-center gap-2 rounded-xl p-4 text-sm hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20">
              <ImageIcon className="h-5 w-5 text-emerald-600" />
              Images
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImages(e.target.files)} />
            </label>
            <label className="glass-card flex cursor-pointer flex-col items-center gap-2 rounded-xl p-4 text-sm hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20">
              <FileAudio className="h-5 w-5 text-emerald-600" />
              Audio (+ STT)
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudio(e.target.files?.[0] || null)} />
            </label>
            <label className="glass-card flex cursor-pointer flex-col items-center gap-2 rounded-xl p-4 text-sm hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20">
              <FileText className="h-5 w-5 text-emerald-600" />
              PDF
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handlePdf(e.target.files?.[0] || null)} />
            </label>
          </div>
          {uploading && <p className="text-sm text-emerald-700">Uploading…</p>}
          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.images.map((img) => (
                <img key={img} src={img} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ))}
            </div>
          )}
          {form.transcript && (
            <textarea
              className="input-field min-h-20"
              value={form.transcript}
              onChange={(e) => setForm({ ...form, transcript: e.target.value })}
              placeholder="Transcript"
            />
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={runAi} disabled={aiLoading} className="btn-secondary inline-flex items-center gap-2">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI Assist
            </button>
            <button type="submit" disabled={submitting} className="btn-primary inline-flex items-center gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit for Review
            </button>
          </div>
          {form.ai_summary && (
            <div className="rounded-xl bg-emerald-50 p-3 text-sm dark:bg-emerald-900/30">
              <strong>AI Summary:</strong> {form.ai_summary}
              <div className="mt-2 flex flex-wrap gap-1">
                {form.ai_keywords.map((k) => (
                  <span key={k} className="rounded-full bg-white px-2 py-0.5 text-xs dark:bg-stone-800">
                    #{k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </form>
      )}

      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => setFilter('all')} className={`rounded-lg px-3 py-1.5 text-sm ${filter === 'all' ? 'bg-emerald-100 text-emerald-800' : 'text-stone-500'}`}>
          All ({practices.length})
        </button>
      </div>

      {loading ? (
        <p className="text-stone-500">Loading submissions…</p>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-stone-500">No submissions yet. Share your first practice!</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className="glass-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs capitalize text-stone-500">
                  {statusIcon(p.status)} {p.status} · {p.category_name}
                </div>
                <Link to={`/practices/${p.id}`} className="font-semibold text-stone-800 hover:text-emerald-700 dark:text-stone-100">
                  {p.title}
                </Link>
                <p className="text-xs text-stone-500">
                  {[p.village, p.district, p.state].filter(Boolean).join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/practices/${p.id}`} className="btn-secondary text-xs">
                  View
                </Link>
                <button onClick={() => remove(p.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
