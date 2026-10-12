import React from 'react';
import { StudySchedule, Topic, Unit } from '../../types/database';
import { CheckCircle2, Circle, Calendar, ChevronRight, Layers, BookOpen } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

interface TodayScheduleProps {
  schedules: StudySchedule[];
  completedTopicIds: Set<string>;
  onToggleComplete: (topicId: string, isCompleted: boolean) => void;
  onOpenTopic: (topic: Topic, unit?: Unit) => void;
}

export const TodaySchedule: React.FC<TodayScheduleProps> = ({
  schedules,
  completedTopicIds,
  onToggleComplete,
  onOpenTopic,
}) => {
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const completedTodayCount = schedules.filter(
    (s) => s.topic_id && completedTopicIds.has(s.topic_id)
  ).length;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <h3 className="text-base font-bold text-stone-900">Today's Focus</h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            {todayFormatted}
          </p>
        </div>

        {schedules.length > 0 && (
          <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
            <span className="text-stone-500">Scheduled:</span>
            <span className="font-semibold text-stone-800">
              {completedTodayCount} of {schedules.length} marked complete
            </span>
          </div>
        )}
      </div>

      {/* Schedule Items */}
      <div className="mt-5">
        {schedules.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No topics scheduled for today"
            description="Take this opportunity to revise past topics or explore upcoming units in the syllabus."
          />
        ) : (
          <div className="space-y-3">
            {schedules.map((item) => {
              const isCompleted = completedTopicIds.has(item.topic_id);
              const topic = item.topic;
              const unit = item.unit;

              if (!topic) return null;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition duration-150 flex items-start gap-4 ${
                    isCompleted
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-white border-stone-200 hover:border-emerald-300 hover:shadow-xs'
                  }`}
                >
                  {/* Manual Checkbox */}
                  <button
                    type="button"
                    onClick={() => onToggleComplete(topic.id, isCompleted)}
                    className="mt-0.5 text-stone-400 hover:text-emerald-700 transition flex-shrink-0"
                    title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    ) : (
                      <Circle className="w-5 h-5 hover:text-stone-700" />
                    )}
                  </button>

                  {/* Topic info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {unit && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                          <Layers className="w-3 h-3 text-stone-400" />
                          {unit.title}
                        </span>
                      )}
                      {item.notes && (
                        <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Note: {item.notes}
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-semibold transition ${
                        isCompleted ? 'line-through text-stone-500' : 'text-stone-900'
                      }`}
                    >
                      {topic.title}
                    </h4>

                    {topic.description && (
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                        {topic.description}
                      </p>
                    )}
                  </div>

                  {/* View Materials Button */}
                  <button
                    type="button"
                    onClick={() => onOpenTopic(topic, unit)}
                    className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
                  >
                    <span>Materials</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
