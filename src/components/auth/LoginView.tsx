import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Lock, Mail, Loader2, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { signIn, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);
      const res = await signIn(email.trim(), password);
      if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (targetRole: 'admin' | 'student') => {
    setEmail(targetRole === 'admin' ? 'admin@chemsite.internal' : 'student@chemsite.internal');
    setPassword('study-portal-2028');
    setSubmitting(true);
    setErrorMessage(null);
    const res = await signIn(
      targetRole === 'admin' ? 'admin@chemsite.internal' : 'student@chemsite.internal',
      'study-portal-2028'
    );
    if (res.error) {
      setErrorMessage(res.error);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-md ring-4 ring-emerald-600/20">
          <BookOpen className="w-7 h-7" />
        </div>

        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-stone-900">
          ChemSITE Study Portal
        </h2>
        <p className="mt-1 text-center text-xs text-stone-500">
          Private IIT-JAM Chemistry 2028 Preparation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-stone-200 rounded-3xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Authorized Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@... or student@..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-white rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-white rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  required={isConfigured}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-500 transition shadow-xs"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Sign In to Portal</span>
            </button>
          </form>

          {/* Demonstration Quick Selector (When exploring locally) */}
          <div className="mt-6 pt-6 border-t border-stone-100">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400 text-center mb-3">
              One-Click Role Access
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('student')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 text-stone-700 hover:text-emerald-900 text-xs font-semibold transition"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Student View</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 hover:text-stone-900 text-xs font-semibold transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-stone-700" />
                <span>Admin View</span>
              </button>
            </div>

            <p className="mt-4 text-[11px] text-stone-400 text-center leading-relaxed">
              Private portal access. Public user registration is disabled by policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
