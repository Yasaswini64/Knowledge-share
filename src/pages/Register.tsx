import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import { apiPost } from '../lib/api';
import { INDIAN_STATES } from '../lib/constants';
import type { UserRole } from '../lib/types';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'contributor' as UserRole,
    state: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name } },
      });
      if (error) throw error;
      if (data.user) {
        await apiPost('/api/profiles', {
          user_id: data.user.id,
          email: form.email,
          full_name: form.full_name,
          role: form.role === 'admin' ? 'contributor' : form.role,
          state: form.state,
        });
      }
      toast.success('Account created! You can now explore and contribute.');
      navigate('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="glass-card w-full rounded-3xl p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-600 text-white">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-stone-800 dark:text-stone-100">Join Sustainable Heritage</h1>
          <p className="mt-1 text-sm text-stone-500">Preserve traditional wisdom with us</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Full Name</label>
            <input
              required
              className="input-field"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              required
              className="input-field"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select
              className="input-field"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
            >
              <option value="contributor">Contributor</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">State</label>
            <select className="input-field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-stone-400">
          <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
          or
          <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
        </div>

        <button
          type="button"
          onClick={() => signInWithGoogle('Sustainable Heritage')}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium dark:border-stone-700 dark:bg-stone-900"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="h-4 w-4" />
          Sign up with Google
        </button>

        <p className="mt-5 text-center text-sm text-stone-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
