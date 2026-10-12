import React, { useState } from 'react';
import { Topic, Subtopic, Unit } from '../../types/database';
import { SubtopicRow } from './SubtopicRow';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  BookOpen,
} from 'lucide-react';

interface TopicDropdownItemProps {
  topic: Topic;
  unit: Unit;
  subtopics: Subtopic[];
  completedSubtopicIds: Set<string>;
  onToggleSubtopicComplete: (subtopicId: string, isCompleted: boolean) => void;
  onOpenResources: (topic: Topic, unit: Unit) => void;
}

export const TopicDropdownItem: React.FC<TopicDropdownItemProps> = ({
  topic,
  unit,
  subtopics,
  completedSubtopicIds,
  onToggleSubtopicComplete,
  onOpenResources,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalSubtopics = subtopics.length;
  const completedSubtopics = subtopics.filter((st) => completedSubtopicIds.has(st.id)).length;
  const isTopicFullyComplete = totalSubtopics > 0 && completedSubtopics === totalSubtopics;
  const topicPercent = totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;

  // Toggle all subtopics in this topic
  const handleToggleAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shouldMarkComplete = !isTopicFullyComplete;
    subtopics.forEach((st) => {
      const isStDone = completedSubtopicIds.has(st.id);
      if (shouldMarkComplete && !isStDone) {
        onToggleSubtopicComplete(st.id, false);
      } else if (!shouldMarkComplete && isStDone) {
        onToggleSubtopicComplete(st.id, true);
      }
    });
  };

  return (
    <div className="border border-stone-200/90 rounded-xl bg-white shadow-2xs overflow-hidden transition">
      {/* Level 2: Topic Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-stone-50/80 transition"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Topic-level master checkbox */}
          <button
            type="button"
            onClick={handleToggleAll}
            className="text-stone-400 hover:text-emerald-700 transition flex-shrink-0 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 rounded"
            title={isTopicFullyComplete ? 'Mark all subtopics incomplete' : 'Mark all subtopics complete'}
            aria-label={`Toggle all subtopics for ${topic.title}`}
          >
            {isTopicFullyComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            ) : completedSubtopics > 0 ? (
              <div className="w-4 h-4 rounded-full border-2 border-emerald-600 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>
            ) : (
              <Circle className="w-4 h-4 hover:text-stone-700" />
            )}
          </button>

          {/* Topic Title & Subtopic Count */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`text-xs font-bold transition truncate ${
                  isTopicFullyComplete ? 'text-stone-500' : 'text-stone-900'
                }`}
              >
                {topic.title}
              </h4>

              <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded flex-shrink-0">
                {isExpanded ? '▼' : '▶'} {completedSubtopics}/{totalSubtopics} subtopics ({topicPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right side controls: Resources & Expand arrow */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenResources(topic, unit);
            }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition"
            title="View linked lectures, books, DPPs"
          >
            <BookOpen className="w-3 h-3" />
            <span className="hidden sm:inline">Resources</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition"
            aria-label={isExpanded ? 'Collapse subtopics' : 'Expand subtopics'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Level 3: Individual Subtopics List */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-stone-100 bg-stone-50/40">
          {subtopics.length === 0 ? (
            <div className="py-2 px-3 text-xs text-stone-400 italic">
              No subtopics available.
            </div>
          ) : (
            <div className="space-y-1.5 pl-4 border-l-2 border-emerald-500/20 ml-2 mt-1">
              {subtopics.map((st) => (
                <SubtopicRow
                  key={st.id}
                  subtopic={st}
                  isCompleted={completedSubtopicIds.has(st.id)}
                  onToggleComplete={onToggleSubtopicComplete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
