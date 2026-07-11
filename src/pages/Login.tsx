import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import { useLanguage } from '../contexts/LanguageContext';

export default function Login() {
  const { tr } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@heritage.in');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      });
      if (error) throw error;
      toast.success('Password reset email sent (if the account exists).');
      setForgot(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not send reset email');
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
          <h1 className="font-display text-2xl font-bold text-stone-800 dark:text-stone-100">
            {forgot ? 'Reset Password' : tr('login')}
          </h1>
          <p className="mt-1 text-sm text-stone-500">Access your Sustainable Heritage account</p>
        </div>

        <form onSubmit={forgot ? handleForgot : handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>
          {!forgot && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : forgot ? 'Send Reset Link' : tr('login')}
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="h-4 w-4" />
          Sign in with Google
        </button>

        <div className="mt-5 space-y-2 text-center text-sm text-stone-500">
          <button type="button" onClick={() => setForgot((v) => !v)} className="text-emerald-700 hover:underline dark:text-emerald-400">
            {forgot ? 'Back to login' : 'Forgot password?'}
          </button>
          <p>
            New here?{' '}
            <Link to="/register" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
              {tr('register')}
            </Link>
          </p>
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
            Demo: demo@heritage.in / password123
          </p>
        </div>
      </div>
    </div>
  );
}
