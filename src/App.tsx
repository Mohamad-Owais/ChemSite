import React, { useEffect, useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { Header } from './components/common/Header';
import { StudentDashboard } from './components/student/StudentDashboard';
import { TopicsBrowser } from './components/student/TopicsBrowser';
import { AdminDashboard } from './components/admin/AdminDashboard';
import {
  Unit,
  Topic,
  StudySchedule,
  Resource,
  SyllabusDocument,
  TopicCompletion,
} from './types/database';
import {
  fetchUnits,
  fetchTopics,
  fetchSchedules,
  fetchResources,
  fetchActiveSyllabus,
  fetchTopicCompletions,
  fetchAllCompletions,
  toggleTopicCompletion,
} from './lib/dataService';
import { Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();

  const [currentView, setCurrentView] = useState<'student' | 'topics' | 'admin'>('student');
  const [dataLoading, setDataLoading] = useState(true);

  // Core application data
  const [units, setUnits] = useState<Unit[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [schedules, setSchedules] = useState<StudySchedule[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [syllabus, setSyllabus] = useState<SyllabusDocument | null>(null);
  const [completions, setCompletions] = useState<TopicCompletion[]>([]);

  // Set of topic IDs completed by current student
  const completedTopicIds = new Set(
    completions
      .filter((c) => (user ? c.user_id === user.id : true))
      .map((c) => c.topic_id)
  );

  const loadAllData = useCallback(async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      const [u, t, s, r, syl] = await Promise.all([
        fetchUnits(),
        fetchTopics(),
        fetchSchedules(),
        fetchResources(),
        fetchActiveSyllabus(),
      ]);

      setUnits(u);
      setTopics(t);
      setSchedules(s);
      setResources(r);
      setSyllabus(syl);

      // Load completions
      if (isAdmin) {
        const allComps = await fetchAllCompletions();
        setCompletions(allComps);
      } else {
        const userComps = await fetchTopicCompletions(user.id);
        setCompletions(userComps);
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, loadAllData]);

  // Toggle completion handler
  const handleToggleComplete = async (topicId: string, isCurrentlyComplete: boolean) => {
    if (!user) return;

    // Optimistic state update
    if (isCurrentlyComplete) {
      setCompletions((prev) => prev.filter((c) => !(c.topic_id === topicId && c.user_id === user.id)));
    } else {
      setCompletions((prev) => [
        ...prev,
        {
          id: 'temp_' + Date.now(),
          topic_id: topicId,
          user_id: user.id,
          completed_at: new Date().toISOString(),
        },
      ]);
    }

    try {
      await toggleTopicCompletion(topicId, user.id, isCurrentlyComplete);
    } catch (err) {
      console.error('Failed to toggle completion:', err);
      // Re-sync on error
      loadAllData();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'syllabus') {
            setCurrentView('topics');
          } else {
            setCurrentView(view);
          }
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {dataLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-2" />
            <p className="text-xs font-medium">Loading study portal data...</p>
          </div>
        ) : (
          <>
            {currentView === 'student' && (
              <StudentDashboard
                units={units}
                topics={topics}
                schedules={schedules}
                syllabus={syllabus}
                completedTopicIds={completedTopicIds}
                onToggleComplete={handleToggleComplete}
                onNavigateToTopics={() => setCurrentView('topics')}
              />
            )}

            {currentView === 'topics' && (
              <TopicsBrowser
                units={units}
                topics={topics}
                syllabus={syllabus}
                completedTopicIds={completedTopicIds}
                onToggleComplete={handleToggleComplete}
                onSyllabusUpdated={loadAllData}
              />
            )}

            {currentView === 'admin' && isAdmin && (
              <AdminDashboard
                units={units}
                topics={topics}
                schedules={schedules}
                resources={resources}
                syllabus={syllabus}
                completions={completions}
                onDataChanged={loadAllData}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-12 text-center text-xs text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2028 ChemSITE — Dedicated Personal Study Portal for IIT-JAM Chemistry</p>
          <p className="font-mono text-[11px] text-stone-400">Private & Secure</p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
