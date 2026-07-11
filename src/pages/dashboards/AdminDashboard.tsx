import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Loader2, Shield, Trash2, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiGet, apiPut, apiPost, apiDelete } from '../../lib/api';
import type { AnalyticsData, Category, Practice, Profile, UserRole } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';

const COLORS = ['#059669', '#65a30d', '#0d9488', '#ca8a04', '#ea580c', '#2563eb', '#7c3aed', '#db2777'];

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'analytics' | 'users' | 'categories' | 'moderation'>('analytics');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState({ name: '', description: '', icon: 'Leaf' });

  const load = async () => {
    setLoading(true);
    try {
      const [a, u, c, pPending, pAll] = await Promise.all([
        apiGet<AnalyticsData>('/api/analytics'),
        apiGet<Profile[]>('/api/profiles'),
        apiGet<Category[]>('/api/categories'),
        apiGet<Practice[]>('/api/practices?status=pending'),
        apiGet<Practice[]>('/api/practices?status=approved&limit=20'),
      ]);
      setAnalytics(a);
      setUsers(u);
      setCategories(c);
      setPractices([...pPending, ...pAll]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateRole = async (user_id: string, role: UserRole) => {
    try {
      await apiPut('/api/profiles', { user_id, role });
      toast.success('Role updated');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost('/api/categories', newCat);
      toast.success('Category added');
      setNewCat({ name: '', description: '', icon: 'Leaf' });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('Delete category?')) return;
    try {
      await apiDelete('/api/categories', { id });
      toast.success('Deleted');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  };

  const deletePractice = async (id: number) => {
    if (!confirm('Remove this practice?')) return;
    try {
      await apiDelete('/api/practices', { id });
      toast.success('Removed');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  };

  const toggleFeatured = async (p: Practice) => {
    try {
      await apiPut('/api/practices', { id: p.id, featured: !p.featured });
      toast.success(p.featured ? 'Unfeatured' : 'Featured');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold text-stone-800 dark:text-stone-100">
          <Shield className="h-7 w-7 text-emerald-600" /> Admin Dashboard
        </h1>
        <p className="text-sm text-stone-500">Platform management · {profile?.full_name}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(['analytics', 'users', 'categories', 'moderation'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize ${
              tab === t
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-stone-600 ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ['Total Practices', analytics.total_practices],
              ['Pending', analytics.pending],
              ['Approved', analytics.approved],
              ['Contributors', analytics.active_contributors],
            ].map(([label, value]) => (
              <div key={String(label)} className="glass-card rounded-2xl p-4">
                <p className="text-2xl font-bold text-stone-800 dark:text-white">{value}</p>
                <p className="text-xs text-stone-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-card rounded-2xl p-4">
              <h3 className="mb-3 font-semibold">Category Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.category_distribution}
                      dataKey="count"
                      nameKey="category"
                      outerRadius={90}
                      label
                    >
                      {analytics.category_distribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <h3 className="mb-3 font-semibold">State-wise Practices</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.state_distribution.slice(0, 8)}>
                    <XAxis dataKey="state" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#059669" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-4 lg:col-span-2">
              <h3 className="mb-3 font-semibold">Monthly Uploads</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.monthly_uploads}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d6d3d1" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#65a30d" strokeWidth={2} name="Uploads" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            {analytics.expert_stats.length > 0 && (
              <div className="glass-card rounded-2xl p-4 lg:col-span-2">
                <h3 className="mb-3 font-semibold">Expert Approval Stats</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.expert_stats}>
                      <XAxis dataKey="expert" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="approved" fill="#059669" name="Approved" />
                      <Bar dataKey="rejected" fill="#e11d48" name="Rejected" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="flex items-center gap-2 border-b border-stone-100 px-4 py-3 dark:border-stone-800">
            <Users className="h-4 w-4 text-emerald-600" />
            <h3 className="font-semibold">User Management ({users.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase text-stone-500 dark:bg-stone-900">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} className="border-t border-stone-100 dark:border-stone-800">
                    <td className="px-4 py-3 font-medium">{u.full_name}</td>
                    <td className="px-4 py-3 text-stone-500">{u.email}</td>
                    <td className="px-4 py-3">{u.state || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        className="input-field py-1.5 text-xs"
                        value={u.role}
                        onChange={(e) => updateRole(u.user_id, e.target.value as UserRole)}
                      >
                        <option value="contributor">Contributor</option>
                        <option value="expert">Expert</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={addCategory} className="glass-card space-y-3 rounded-2xl p-5">
            <h3 className="font-semibold">Add Category</h3>
            <input
              className="input-field"
              placeholder="Name"
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
              required
            />
            <textarea
              className="input-field"
              placeholder="Description"
              value={newCat.description}
              onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Icon name (Leaf, Droplets...)"
              value={newCat.icon}
              onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
            />
            <button className="btn-primary" type="submit">
              Add Category
            </button>
          </form>
          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="glass-card flex items-center justify-between rounded-xl p-4">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-stone-500">{c.practice_count || 0} practices</p>
                </div>
                <button onClick={() => deleteCategory(c.id)} className="text-rose-500 hover:bg-rose-50 rounded-lg p-2">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'moderation' && (
        <div className="space-y-3">
          {practices.map((p) => (
            <div key={p.id} className="glass-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{p.title}</p>
                <p className="text-xs capitalize text-stone-500">
                  {p.status} · {p.category_name} · {p.state}
                  {p.featured ? ' · Featured' : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleFeatured(p)} className="btn-secondary text-xs">
                  {p.featured ? 'Unfeature' : 'Feature'}
                </button>
                <button onClick={() => deletePractice(p.id)} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:bg-rose-950/40">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
