import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, LogOut, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  currentView: 'student' | 'admin' | 'syllabus' | 'topics';
  onNavigate: (view: 'student' | 'admin' | 'syllabus' | 'topics') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { user, profile, isAdmin, isConfigured, signOut, switchDemoRole } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {!isConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Local Preview Mode:</strong> Connect your Supabase project in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code> to persist with live PostgreSQL.
            </span>
          </div>
          {switchDemoRole && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition mr-2"
                title="Reload with official syllabus"
              >
                ↻ Load Official Syllabus
              </button>
              <span className="text-stone-500 font-medium">Switch view as:</span>
              <button
                type="button"
                onClick={() => switchDemoRole('admin')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                  isAdmin ? 'bg-amber-700 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('student')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                  !isAdmin ? 'bg-amber-700 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                }`}
              >
                Student
              </button>
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-600/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 text-lg tracking-tight">ChemSITE</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200">
                  IIT-JAM 2028
                </span>
              </div>
              <p className="text-xs text-stone-500">Private Chemistry Study Portal</p>
            </div>
          </div>

          {/* Navigation items */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              type="button"
              onClick={() => onNavigate('student')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                currentView === 'student'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              Study Dashboard
            </button>
            <button
              type="button"
              onClick={() => onNavigate('topics')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                currentView === 'topics'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              Syllabus & Library
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  currentView === 'admin'
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Admin Panel</span>
              </button>
            )}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-semibold text-stone-900">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </span>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" />
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full border border-stone-200">
                    <UserCheck className="w-3 h-3" />
                    Student
                  </span>
                )}
              </div>
              <div className="text-[11px] text-stone-500 font-mono">{user?.email}</div>
            </div>

            <button
              type="button"
              onClick={() => signOut()}
              title="Sign Out"
              className="p-2 text-stone-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-stone-100 text-xs">
          <button
            type="button"
            onClick={() => onNavigate('student')}
            className={`py-1.5 px-2.5 rounded font-medium ${
              currentView === 'student' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'text-stone-600'
            }`}
          >
            Study Plan
          </button>
          <button
            type="button"
            onClick={() => onNavigate('topics')}
            className={`py-1.5 px-2.5 rounded font-medium ${
              currentView === 'topics' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'text-stone-600'
            }`}
          >
            Topics & Library
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className={`py-1.5 px-2.5 rounded font-medium ${
                currentView === 'admin' ? 'bg-stone-900 text-white' : 'text-stone-700 font-semibold'
              }`}
            >
              Admin Panel
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
