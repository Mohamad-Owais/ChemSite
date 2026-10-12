import React, { useState } from 'react';
import { Unit, Topic, StudySchedule, SyllabusDocument } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import { TodaySchedule } from './TodaySchedule';
import { UpcomingSchedule } from './UpcomingSchedule';
import { PastSchedule } from './PastSchedule';
import { TopicDetailsModal } from './TopicDetailsModal';
import { CheckCircle2, BookOpen, Clock, Calendar, ArrowRight } from 'lucide-react';

interface StudentDashboardProps {
  units: Unit[];
  topics: Topic[];
  schedules: StudySchedule[];
  syllabus: SyllabusDocument | null;
  completedTopicIds: Set<string>;
  onToggleComplete: (topicId: string, isCompleted: boolean) => void;
  onNavigateToTopics: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  topics,
  schedules,
  completedTopicIds,
  onToggleComplete,
  onNavigateToTopics,
}) => {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'past'>('today');
  const [selectedTopic, setSelectedTopic] = useState<{ topic: Topic; unit?: Unit } | null>(null);

  // Partition schedules into today, upcoming, and past
  const todayDateStr = new Date().toISOString().split('T')[0];

  const todaySchedules = schedules.filter((s) => s.scheduled_date === todayDateStr);
  const upcomingSchedules = schedules.filter((s) => s.scheduled_date > todayDateStr);
  const pastSchedules = schedules
    .filter((s) => s.scheduled_date < todayDateStr)
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date));

  // Overall counts
  const totalTopicsCount = topics.length;
  const completedTopicsCount = topics.filter((t) => completedTopicIds.has(t.id)).length;
  const remainingTopicsCount = Math.max(0, totalTopicsCount - completedTopicsCount);
  const overallPercent = totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

  const studentName = profile?.full_name || user?.email?.split('@')[0] || 'Friend';

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Summary Card */}
      <div className="bg-gradient-to-r from-emerald-900 to-stone-900 rounded-3xl p-6 md:p-8 text-white shadow-sm relative overflow-hidden">
        {/* Subtle decorative pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-800/80 text-emerald-200 border border-emerald-700/50 mb-3">
            🎯 IIT-JAM Chemistry Preparation
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back, {studentName}
          </h1>
          <p className="text-stone-300 text-xs md:text-sm mt-1.5 leading-relaxed">
            Here is your daily study planner. Take your time, focus on concepts, and mark topics complete as you finish understanding them.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToTopics}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Syllabus & Resource Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Quick Metric Card */}
        <div className="mt-6 pt-6 border-t border-emerald-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-stone-300 font-medium block">Total Topics</span>
            <div className="text-xl font-bold text-white mt-0.5">{totalTopicsCount}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-emerald-300 font-medium block">Completed</span>
            <div className="text-xl font-bold text-emerald-300 mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              {completedTopicsCount}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-amber-300 font-medium block">Remaining</span>
            <div className="text-xl font-bold text-amber-200 mt-0.5">{remainingTopicsCount}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-stone-300 font-medium block">Overall Progress</span>
            <div className="text-xl font-bold text-white mt-0.5">{overallPercent}%</div>
            <div className="w-full bg-stone-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'today'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Today ({todaySchedules.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'upcoming'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Upcoming ({upcomingSchedules.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('past')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'past'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Past & Revision ({pastSchedules.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'today' && (
        <TodaySchedule
          schedules={todaySchedules}
          completedTopicIds={completedTopicIds}
          onToggleComplete={onToggleComplete}
          onOpenTopic={(topic, unit) => setSelectedTopic({ topic, unit })}
        />
      )}

      {activeTab === 'upcoming' && (
        <UpcomingSchedule
          schedules={upcomingSchedules}
          completedTopicIds={completedTopicIds}
          onToggleComplete={onToggleComplete}
          onOpenTopic={(topic, unit) => setSelectedTopic({ topic, unit })}
        />
      )}

      {activeTab === 'past' && (
        <PastSchedule
          schedules={pastSchedules}
          completedTopicIds={completedTopicIds}
          onToggleComplete={onToggleComplete}
          onOpenTopic={(topic, unit) => setSelectedTopic({ topic, unit })}
        />
      )}

      {/* Topic Details Modal */}
      {selectedTopic && (
        <TopicDetailsModal
          isOpen={Boolean(selectedTopic)}
          onClose={() => setSelectedTopic(null)}
          topic={selectedTopic.topic}
          unit={selectedTopic.unit}
          isCompleted={completedTopicIds.has(selectedTopic.topic.id)}
          onToggleComplete={onToggleComplete}
        />
      )}
    </div>
  );
};
