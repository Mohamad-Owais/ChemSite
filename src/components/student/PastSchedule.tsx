import React from 'react';
import { StudySchedule, Topic, Unit } from '../../types/database';
import { Calendar, ChevronRight, CheckCircle2, Circle, Layers } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

interface PastScheduleProps {
  schedules: StudySchedule[];
  completedTopicIds: Set<string>;
  onToggleComplete: (topicId: string, isCompleted: boolean) => void;
  onOpenTopic: (topic: Topic, unit?: Unit) => void;
}

export const PastSchedule: React.FC<PastScheduleProps> = ({
  schedules,
  completedTopicIds,
  onToggleComplete,
  onOpenTopic,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div>
          <h3 className="text-base font-bold text-stone-900">Past Schedule & Revisions</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Previously scheduled topics. Check off any topics you completed.
          </p>
        </div>
        <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
          {schedules.length} Items
        </span>
      </div>

      <div className="mt-4">
        {schedules.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No past schedule entries"
            description="As your study calendar progresses, past study dates will appear here for revision."
          />
        ) : (
          <div className="space-y-3">
            {schedules.map((item) => {
              const topic = item.topic;
              const unit = item.unit;
              const isCompleted = item.topic_id ? completedTopicIds.has(item.topic_id) : false;

              if (!topic) return null;

              const dateFormatted = new Date(item.scheduled_date + 'T00:00:00').toLocaleDateString(
                'en-US',
                {
                  month: 'short',
                  day: 'numeric',
                }
              );

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-stone-50/50 border-stone-200'
                      : 'bg-amber-50/30 border-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleComplete(topic.id, isCompleted)}
                      className="mt-0.5 text-stone-400 hover:text-emerald-700 transition flex-shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Circle className="w-4 h-4 hover:text-stone-700" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded font-mono">
                          {dateFormatted}
                        </span>
                        {unit && (
                          <span className="text-[11px] text-stone-500 truncate flex items-center gap-1">
                            <Layers className="w-3 h-3 text-stone-400" />
                            {unit.title}
                          </span>
                        )}
                        {!isCompleted && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/60 px-1.5 py-0.2 rounded">
                            Pending
                          </span>
                        )}
                      </div>
                      <h4
                        className={`text-xs font-semibold truncate ${
                          isCompleted ? 'text-stone-500 line-through' : 'text-stone-900'
                        }`}
                      >
                        {topic.title}
                      </h4>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenTopic(topic, unit)}
                    className="flex-shrink-0 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
                    title="View Resources"
                  >
                    <ChevronRight className="w-4 h-4" />
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
