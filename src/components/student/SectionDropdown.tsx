import React, { useState } from 'react';
import { Unit, Topic, Subtopic } from '../../types/database';
import { TopicDropdownItem } from './TopicDropdownItem';
import { Layers, ChevronDown, ChevronRight } from 'lucide-react';

interface SectionDropdownProps {
  unit: Unit;
  topics: Topic[];
  subtopicsByTopicId: Record<string, Subtopic[]>;
  completedSubtopicIds: Set<string>;
  onToggleSubtopicComplete: (subtopicId: string, isCompleted: boolean) => void;
  onOpenResources: (topic: Topic, unit: Unit) => void;
  defaultExpanded?: boolean;
}

export const SectionDropdown: React.FC<SectionDropdownProps> = ({
  unit,
  topics,
  subtopicsByTopicId,
  completedSubtopicIds,
  onToggleSubtopicComplete,
  onOpenResources,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Aggregate descendant subtopics across all topics in this section
  const allSectionSubtopics = topics.flatMap((t) => subtopicsByTopicId[t.id] || []);
  const totalSubtopics = allSectionSubtopics.length;
  const completedSubtopics = allSectionSubtopics.filter((st) => completedSubtopicIds.has(st.id)).length;
  const sectionPercent = totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden transition">
      {/* Level 1: Section / Unit Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-stone-50/70 select-none transition"
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
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/50 flex-shrink-0 mt-0.5">
            <Layers className="w-5 h-5 text-emerald-800" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-stone-900">{unit.title}</h3>
              <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md flex-shrink-0">
                {isExpanded ? '▼' : '▶'} {completedSubtopics}/{totalSubtopics} subtopics ({sectionPercent}%)
              </span>
            </div>

            {unit.description && (
              <p className="text-xs text-stone-500 mt-1 line-clamp-1">{unit.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 ml-2 flex-shrink-0">
          {/* Progress Bar */}
          <div className="w-24 bg-stone-100 rounded-full h-2 hidden sm:block overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${sectionPercent}%` }}
            />
          </div>

          <button
            type="button"
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
            aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Level 2: Topic Dropdown List */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 border-t border-stone-100 space-y-2.5 bg-stone-50/20">
          {topics.length === 0 ? (
            <div className="py-4 text-xs text-stone-400 italic text-center">
              No topics in this section yet.
            </div>
          ) : (
            topics.map((topic) => (
              <TopicDropdownItem
                key={topic.id}
                topic={topic}
                unit={unit}
                subtopics={subtopicsByTopicId[topic.id] || []}
                completedSubtopicIds={completedSubtopicIds}
                onToggleSubtopicComplete={onToggleSubtopicComplete}
                onOpenResources={onOpenResources}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
