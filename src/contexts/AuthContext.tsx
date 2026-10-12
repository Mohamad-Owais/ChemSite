import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, UserRole } from '../types/database';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  role: UserRole | null;
  isAdmin: boolean;
  isStudent: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  // Dev switchers for testing when offline
  switchDemoRole?: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ADMIN_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@chemsite.internal',
  role: 'admin',
  full_name: 'Lead Mentor (Admin)',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEMO_STUDENT_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'student@chemsite.internal',
  role: 'student',
  full_name: 'IIT-JAM Aspirant (Student)',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // In demo mode (unconfigured supabase), fallback to localStorage saved role
  const [demoRole, setDemoRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('chemsite_demo_role');
    return (saved as UserRole) || 'student';
  });

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Profile fetch error, checking user metadata:', error);
        // Fallback default profile if not found
        setProfile({
          id: userId,
          email,
          role: 'student',
          full_name: email.split('@')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Offline / Preview mode: initialize with selected demo profile
      const activeDemo = demoRole === 'admin' ? DEMO_ADMIN_PROFILE : DEMO_STUDENT_PROFILE;
      setUser({ id: activeDemo.id, email: activeDemo.email });
      setProfile(activeDemo);
      setIsLoading(false);
      return;
    }

    // Live Supabase mode
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
          await fetchProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth session error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
          await fetchProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [demoRole]);

  const signIn = async (email: string, password = ''): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) {
      // Mock login for offline testing
      if (email.toLowerCase().includes('admin')) {
        setDemoRole('admin');
        localStorage.setItem('chemsite_demo_role', 'admin');
        setUser({ id: DEMO_ADMIN_PROFILE.id, email: DEMO_ADMIN_PROFILE.email });
        setProfile(DEMO_ADMIN_PROFILE);
      } else {
        setDemoRole('student');
        localStorage.setItem('chemsite_demo_role', 'student');
        setUser({ id: DEMO_STUDENT_PROFILE.id, email: DEMO_STUDENT_PROFILE.email });
        setProfile(DEMO_STUDENT_PROFILE);
      }
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email || '' });
        await fetchProfile(data.user.id, data.user.email || '');
      }

      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      return { error: msg };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  const switchDemoRole = (role: UserRole) => {
    setDemoRole(role);
    localStorage.setItem('chemsite_demo_role', role);
    const p = role === 'admin' ? DEMO_ADMIN_PROFILE : DEMO_STUDENT_PROFILE;
    setUser({ id: p.id, email: p.email });
    setProfile(p);
  };

  const role = profile?.role || null;
  const isAdmin = role === 'admin';
  const isStudent = role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        isStudent,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signOut,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
