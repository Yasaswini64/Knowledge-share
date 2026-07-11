import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  Share2,
  FileText,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import { apiGet, apiPost } from '../lib/api';
import type { Comment, Practice } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import PracticeCard from '../components/PracticeCard';
import { PageLoader } from '../components/LoadingSkeleton';

export default function PracticeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { tr } = useLanguage();
  const [practice, setPractice] = useState<Practice | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [related, setRelated] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const shareUrl = useMemo(() => (typeof window !== 'undefined' ? window.location.href : ''), []);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await apiGet<Practice>(`/api/practices?id=${id}`);
      setPractice(p);
      const [c, r] = await Promise.all([
        apiGet<Comment[]>(`/api/comments?practice_id=${id}`),
        apiGet<Practice[]>(`/api/practices?category_id=${p.category_id}&limit=4`),
      ]);
      setComments(c);
      setRelated(r.filter((x) => x.id !== p.id).slice(0, 3));
    } catch (e) {
      console.error(e);
      toast.error('Failed to load practice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const toggleLike = async () => {
    if (!user || !practice) return toast.info('Please login to like');
    try {
      const res = await apiPost<{ liked: boolean; likes_count: number }>('/api/likes', {
        practice_id: practice.id,
      });
      setPractice({ ...practice, liked: res.liked, likes_count: res.likes_count });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  };

  const toggleBookmark = async () => {
    if (!user || !practice) return toast.info('Please login to bookmark');
    try {
      const res = await apiPost<{ bookmarked: boolean }>('/api/bookmarks', { practice_id: practice.id });
      setPractice({ ...practice, bookmarked: res.bookmarked });
      toast.success(res.bookmarked ? 'Bookmarked' : 'Bookmark removed');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: practice?.title, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard');
      }
    } catch {
      /* cancelled */
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.info('Please login to comment');
    if (!commentText.trim() || !practice) return;
    setSubmitting(true);
    try {
      const c = await apiPost<Comment>('/api/comments', {
        practice_id: practice.id,
        content: commentText,
      });
      setComments((prev) => [c, ...prev]);
      setCommentText('');
      setPractice({ ...practice, comments_count: (practice.comments_count || 0) + 1 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to comment');
    } finally {
      setSubmitting(false);
    }
  };

  const exportPdf = () => {
    if (!practice) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${practice.title}</title>
      <style>body{font-family:system-ui;padding:32px;color:#1c1917;max-width:800px;margin:auto}
      h1{color:#065f46} .meta{color:#57534e;font-size:14px} section{margin-top:20px}</style></head><body>
      <h1>${practice.title}</h1>
      <p class="meta">${practice.category_name} · ${practice.state} · by ${practice.contributor_name}</p>
      <section><h3>Description</h3><p>${practice.description}</p></section>
      <section><h3>Benefits</h3><p>${practice.benefits || '—'}</p></section>
      <section><h3>Modern Adaptation</h3><p>${practice.modern_adaptation || '—'}</p></section>
      <section><h3>AI Summary</h3><p>${practice.ai_summary || '—'}</p></section>
      <p class="meta">Exported from Sustainable Heritage</p>
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  if (loading) return <PageLoader />;
  if (!practice) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-stone-500">Practice not found</p>
        <Link to="/feed" className="mt-4 inline-block text-emerald-700 hover:underline">
          Back to feed
        </Link>
      </div>
    );
  }

  const images =
    practice.images?.length > 0
      ? practice.images
      : ['https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=1200'];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-3xl">
            <img src={images[activeImage]} alt={practice.title} className="h-72 w-full object-cover sm:h-96" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl ring-2 ${
                    activeImage === i ? 'ring-emerald-500' : 'ring-transparent'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-6">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                {practice.category_name}
              </span>
              <span className="inline-flex items-center gap-1 text-stone-500">
                <MapPin className="h-4 w-4" />
                {[practice.village, practice.district, practice.state].filter(Boolean).join(', ')}
              </span>
              {practice.status === 'approved' && (
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Validated
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50 sm:text-4xl">
              {practice.title}
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              by <span className="font-medium text-stone-700 dark:text-stone-300">{practice.contributor_name}</span>
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={toggleLike} className="btn-secondary inline-flex items-center gap-2">
                <Heart className={`h-4 w-4 ${practice.liked ? 'fill-rose-500 text-rose-500' : ''}`} />
                {practice.likes_count || 0}
              </button>
              <button onClick={toggleBookmark} className="btn-secondary inline-flex items-center gap-2">
                <Bookmark className={`h-4 w-4 ${practice.bookmarked ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                {tr('bookmark')}
              </button>
              <button onClick={share} className="btn-secondary inline-flex items-center gap-2">
                <Share2 className="h-4 w-4" /> {tr('share')}
              </button>
              <button onClick={exportPdf} className="btn-secondary inline-flex items-center gap-2">
                <Download className="h-4 w-4" /> PDF
              </button>
            </div>

            <section className="mt-8 space-y-6">
              <div className="glass-card rounded-2xl p-5">
                <h2 className="mb-2 font-display text-lg font-semibold">Description</h2>
                <p className="whitespace-pre-wrap text-stone-600 dark:text-stone-300">{practice.description}</p>
              </div>
              {practice.ai_summary && (
                <div className="glass-card rounded-2xl border-l-4 border-emerald-500 p-5">
                  <h2 className="mb-2 font-display text-lg font-semibold">AI Summary</h2>
                  <p className="text-stone-600 dark:text-stone-300">{practice.ai_summary}</p>
                  {practice.ai_keywords && practice.ai_keywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {practice.ai_keywords.map((k) => (
                        <span key={k} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                          #{k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="glass-card rounded-2xl p-5">
                  <h2 className="mb-2 font-display text-lg font-semibold">{tr('benefits')}</h2>
                  <p className="text-sm text-stone-600 dark:text-stone-300">{practice.benefits || '—'}</p>
                </div>
                <div className="glass-card rounded-2xl p-5">
                  <h2 className="mb-2 font-display text-lg font-semibold">{tr('modernAdaptation')}</h2>
                  <p className="text-sm text-stone-600 dark:text-stone-300">{practice.modern_adaptation || '—'}</p>
                </div>
              </div>
              {practice.audio_url && (
                <div className="glass-card rounded-2xl p-5">
                  <h2 className="mb-3 font-display text-lg font-semibold">Audio Recording</h2>
                  <audio controls className="w-full" src={practice.audio_url}>
                    Your browser does not support audio.
                  </audio>
                  {practice.transcript && (
                    <p className="mt-3 rounded-xl bg-stone-50 p-3 text-sm text-stone-600 dark:bg-stone-900 dark:text-stone-300">
                      <strong>Transcript:</strong> {practice.transcript}
                    </p>
                  )}
                </div>
              )}
              {practice.pdf_url && (
                <a
                  href={practice.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-card inline-flex items-center gap-2 rounded-2xl p-4 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300"
                >
                  <FileText className="h-5 w-5" /> View attached PDF
                </a>
              )}
              {practice.expert_comments && (
                <div className="glass-card rounded-2xl p-5">
                  <h2 className="mb-2 font-display text-lg font-semibold">Expert Validation Notes</h2>
                  <p className="text-sm text-stone-600 dark:text-stone-300">{practice.expert_comments}</p>
                </div>
              )}
            </section>

            <section className="mt-10">
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
                <MessageCircle className="h-5 w-5 text-emerald-600" /> {tr('comments')} ({comments.length})
              </h2>
              <form onSubmit={submitComment} className="mb-4 flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder={user ? 'Share your thoughts…' : 'Login to comment'}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!user}
                />
                <button type="submit" disabled={submitting || !user} className="btn-primary">
                  Post
                </button>
              </form>
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="glass-card rounded-xl p-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-stone-500">
                      <span className="font-semibold text-stone-700 dark:text-stone-200">{c.user_name}</span>
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-300">{c.content}</p>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-sm text-stone-500">No comments yet.</p>}
              </div>
            </section>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="glass-card rounded-2xl p-5 text-center">
            <h3 className="mb-3 font-display font-semibold">QR Code</h3>
            <div className="mx-auto inline-block rounded-xl bg-white p-3">
              <QRCodeSVG value={shareUrl || `practice-${practice.id}`} size={140} />
            </div>
            <p className="mt-2 text-xs text-stone-500">Scan to open this practice</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <h3 className="mb-2 font-display font-semibold">Status</h3>
            <p className="text-sm capitalize text-stone-600 dark:text-stone-300">{practice.status}</p>
            <p className="mt-2 text-xs text-stone-500">{practice.views_count || 0} views</p>
          </div>
          {related.length > 0 && (
            <div>
              <h3 className="mb-3 font-display text-lg font-semibold">{tr('related')}</h3>
              <div className="space-y-4">
                {related.map((r) => (
                  <PracticeCard key={r.id} practice={r} />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
