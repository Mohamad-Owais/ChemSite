import React, { useState } from 'react';
import { Unit, Topic, SyllabusDocument } from '../../types/database';
import { Layers, Search, CheckCircle2, Circle, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { TopicDetailsModal } from './TopicDetailsModal';
import { SyllabusViewer } from '../syllabus/SyllabusViewer';
import { EmptyState } from '../common/EmptyState';

interface TopicsBrowserProps {
  units: Unit[];
  topics: Topic[];
  syllabus: SyllabusDocument | null;
  completedTopicIds: Set<string>;
  onToggleComplete: (topicId: string, isCompleted: boolean) => void;
  onSyllabusUpdated?: () => void;
}

export const TopicsBrowser: React.FC<TopicsBrowserProps> = ({
  units,
  topics,
  syllabus,
  completedTopicIds,
  onToggleComplete,
  onSyllabusUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(
    new Set(units.map((u) => u.id))
  );
  const [activeModalTopic, setActiveModalTopic] = useState<{ topic: Topic; unit: Unit } | null>(null);

  const toggleUnitExpanded = (unitId: string) => {
    setExpandedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  };

  const filteredUnits = units
    .map((unit) => {
      const unitTopics = topics.filter((t) => t.unit_id === unit.id);
      const matchesSearch =
        unit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (unit.description && unit.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchingTopics = searchQuery
        ? unitTopics.filter(
            (t) =>
              matchesSearch ||
              t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        : unitTopics;

      return {
        unit,
        topics: matchingTopics,
        totalTopics: unitTopics.length,
        completedTopics: unitTopics.filter((t) => completedTopicIds.has(t.id)).length,
      };
    })
    .filter((g) => (searchQuery ? g.topics.length > 0 : true));

  return (
    <div className="space-y-6">
      {/* Syllabus Card at Top */}
      <SyllabusViewer syllabus={syllabus} onSyllabusUpdated={onSyllabusUpdated} />

      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Syllabus Units & Topic Library</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Structured hierarchy: Unit → Topic → Curated Study Resources.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics or units..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition"
          />
        </div>
      </div>

      {/* Units list */}
      {filteredUnits.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No topics match your search"
          description="Try modifying your keyword query or clear the search to view all units."
        />
      ) : (
        <div className="space-y-4">
          {filteredUnits.map(({ unit, topics: unitTopics, totalTopics, completedTopics }) => {
            const isExpanded = expandedUnitIds.has(unit.id);
            const unitPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

            return (
              <div
                key={unit.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden transition"
              >
                {/* Unit Header Bar */}
                <div
                  onClick={() => toggleUnitExpanded(unit.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-stone-50/70 select-none transition"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-2 rounded-xl bg-stone-100 text-stone-700 flex-shrink-0 mt-0.5">
                      <Layers className="w-5 h-5 text-emerald-800" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-stone-900">{unit.title}</h3>
                        <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                          {completedTopics}/{totalTopics} Completed ({unitPercent}%)
                        </span>
                      </div>
                      {unit.description && (
                        <p className="text-xs text-stone-500 mt-1 line-clamp-1">{unit.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                    <div className="w-24 bg-stone-100 rounded-full h-2 hidden md:block overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${unitPercent}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Topics in this unit */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-stone-100 divide-y divide-stone-100">
                    {unitTopics.length === 0 ? (
                      <p className="py-4 text-xs text-stone-400 italic">No topics in this unit yet.</p>
                    ) : (
                      unitTopics.map((topic) => {
                        const isCompleted = completedTopicIds.has(topic.id);

                        return (
                          <div
                            key={topic.id}
                            className="py-3 flex items-center justify-between gap-3 group hover:bg-stone-50/50 -mx-2 px-2 rounded-xl transition"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleComplete(topic.id, isCompleted);
                                }}
                                className="mt-0.5 text-stone-400 hover:text-emerald-700 transition flex-shrink-0"
                                title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                                ) : (
                                  <Circle className="w-5 h-5 hover:text-stone-600" />
                                )}
                              </button>

                              <div className="min-w-0">
                                <h4
                                  className={`text-xs font-semibold transition ${
                                    isCompleted ? 'line-through text-stone-500' : 'text-stone-900'
                                  }`}
                                >
                                  {topic.title}
                                </h4>
                                {topic.description && (
                                  <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                                    {topic.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setActiveModalTopic({ topic, unit })}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition flex-shrink-0"
                            >
                              <span>Resources</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Topic Details & Resources Modal */}
      {activeModalTopic && (
        <TopicDetailsModal
          isOpen={Boolean(activeModalTopic)}
          onClose={() => setActiveModalTopic(null)}
          topic={activeModalTopic.topic}
          unit={activeModalTopic.unit}
          isCompleted={completedTopicIds.has(activeModalTopic.topic.id)}
          onToggleComplete={onToggleComplete}
        />
      )}
    </div>
  );
};
