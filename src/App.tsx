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
  Subtopic,
  SubtopicCompletion,
  StudySchedule,
  Resource,
  SyllabusDocument,
  TopicCompletion,
} from './types/database';
import {
  fetchUnits,
  fetchTopics,
  fetchSubtopics,
  fetchSubtopicCompletions,
  toggleSubtopicCompletion,
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
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [schedules, setSchedules] = useState<StudySchedule[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [syllabus, setSyllabus] = useState<SyllabusDocument | null>(null);
  const [completions, setCompletions] = useState<TopicCompletion[]>([]);
  const [subtopicCompletions, setSubtopicCompletions] = useState<SubtopicCompletion[]>([]);

  // Set of subtopic IDs completed by current student
  const completedSubtopicIds = new Set(
    subtopicCompletions
      .filter((c) => (user ? c.user_id === user.id : true))
      .map((c) => c.subtopic_id)
  );

  // Set of topic IDs completed by current student
  // A topic is completed if its entry is in topic_completions OR if all its subtopics are complete
  const completedTopicIds = new Set(
    topics
      .filter((t) => {
        const tSubs = subtopics.filter((st) => st.topic_id === t.id);
        if (tSubs.length > 0) {
          return tSubs.every((st) => completedSubtopicIds.has(st.id));
        }
        return completions.some((c) => (user ? c.user_id === user.id : true) && c.topic_id === t.id);
      })
      .map((t) => t.id)
  );

  const loadAllData = useCallback(async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      const [u, t, subs, s, r, syl] = await Promise.all([
        fetchUnits(),
        fetchTopics(),
        fetchSubtopics(),
        fetchSchedules(),
        fetchResources(),
        fetchActiveSyllabus(),
      ]);

      setUnits(u);
      setTopics(t);
      setSubtopics(subs);
      setSchedules(s);
      setResources(r);
      setSyllabus(syl);

      // Load completions & subtopic completions
      const [subComps] = await Promise.all([
        fetchSubtopicCompletions(user.id),
      ]);
      setSubtopicCompletions(subComps);

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

  // Subtopic completion toggle handler
  const handleToggleSubtopicComplete = async (subtopicId: string, isCurrentlyComplete: boolean) => {
    if (!user) return;

    // Optimistic update
    if (isCurrentlyComplete) {
      setSubtopicCompletions((prev) =>
        prev.filter((c) => !(c.subtopic_id === subtopicId && c.user_id === user.id))
      );
    } else {
      setSubtopicCompletions((prev) => [
        ...prev,
        {
          id: 'temp_sub_' + Date.now(),
          subtopic_id: subtopicId,
          user_id: user.id,
          completed_at: new Date().toISOString(),
        },
      ]);
    }

    try {
      await toggleSubtopicCompletion(subtopicId, user.id, isCurrentlyComplete);
    } catch (err) {
      console.error('Failed to toggle subtopic completion:', err);
      loadAllData();
    }
  };

  // Topic completion toggle handler (e.g. from daily schedule checkboxes)
  const handleToggleComplete = async (topicId: string, isCurrentlyComplete: boolean) => {
    if (!user) return;

    // When toggling a topic from daily schedule: also mark all its subtopics
    const topicSubtopics = subtopics.filter((st) => st.topic_id === topicId);
    if (topicSubtopics.length > 0) {
      const willBeComplete = !isCurrentlyComplete;
      topicSubtopics.forEach((st) => {
        handleToggleSubtopicComplete(st.id, !willBeComplete);
      });
    }

    // Optimistic state update for topic_completions
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
                subtopics={subtopics}
                syllabus={syllabus}
                completedSubtopicIds={completedSubtopicIds}
                onToggleSubtopicComplete={handleToggleSubtopicComplete}
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
