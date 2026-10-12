import React from 'react';
import { Unit, Topic, TopicCompletion } from '../../types/database';
import { CheckCircle2, Circle, Layers } from 'lucide-react';

interface StudentProgressViewProps {
  units: Unit[];
  topics: Topic[];
  completions: TopicCompletion[];
}

export const StudentProgressView: React.FC<StudentProgressViewProps> = ({
  units,
  topics,
  completions,
}) => {
  const completedTopicIdSet = new Set(completions.map((c) => c.topic_id));
  const totalTopics = topics.length;
  const completedCount = topics.filter((t) => completedTopicIdSet.has(t.id)).length;
  const pendingCount = Math.max(0, totalTopics - completedCount);
  const percent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Metric summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <span className="text-xs text-stone-500 font-medium">Completed Topics</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            {completedCount}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            {percent}% of syllabus marked done
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <span className="text-xs text-stone-500 font-medium">Remaining Topics</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {pendingCount}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Out of {totalTopics} total syllabus topics
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <span className="text-xs text-stone-500 font-medium">Syllabus Completion</span>
          <div className="text-2xl font-bold text-stone-900 mt-1">
            {percent}%
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Progress Breakdown by Unit */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-stone-900">Unit-by-Unit Completion Breakdown</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Monitor the student's manual progress across all syllabus units.
          </p>
        </div>

        <div className="space-y-4">
          {units.map((unit) => {
            const unitTopics = topics.filter((t) => t.unit_id === unit.id);
            const unitCompleted = unitTopics.filter((t) => completedTopicIdSet.has(t.id)).length;
            const unitPercent =
              unitTopics.length > 0 ? Math.round((unitCompleted / unitTopics.length) * 100) : 0;

            return (
              <div
                key={unit.id}
                className="p-4 rounded-xl border border-stone-100 bg-stone-50/50 space-y-3"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-800" />
                    <h4 className="text-xs font-bold text-stone-900">{unit.title}</h4>
                  </div>
                  <span className="text-xs font-semibold text-stone-600">
                    {unitCompleted} / {unitTopics.length} ({unitPercent}%)
                  </span>
                </div>

                <div className="w-full bg-stone-200/70 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${unitPercent}%` }}
                  />
                </div>

                {/* Topics in unit status list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {unitTopics.map((topic) => {
                    const isDone = completedTopicIdSet.has(topic.id);
                    return (
                      <div
                        key={topic.id}
                        className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 border ${
                          isDone
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                            : 'bg-white border-stone-200 text-stone-600'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                        )}
                        <span className="truncate font-medium">{topic.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
