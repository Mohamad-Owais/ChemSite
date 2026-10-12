import React, { useState } from 'react';
import { Unit, Topic, Subtopic, SyllabusDocument } from '../../types/database';
import { Search, BookOpen } from 'lucide-react';
import { SectionDropdown } from './SectionDropdown';
import { TopicDetailsModal } from './TopicDetailsModal';
import { SyllabusViewer } from '../syllabus/SyllabusViewer';
import { EmptyState } from '../common/EmptyState';

interface TopicsBrowserProps {
  units: Unit[];
  topics: Topic[];
  subtopics: Subtopic[];
  syllabus: SyllabusDocument | null;
  completedSubtopicIds: Set<string>;
  onToggleSubtopicComplete: (subtopicId: string, isCompleted: boolean) => void;
  onSyllabusUpdated?: () => void;
}

export const TopicsBrowser: React.FC<TopicsBrowserProps> = ({
  units,
  topics,
  subtopics,
  syllabus,
  completedSubtopicIds,
  onToggleSubtopicComplete,
  onSyllabusUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalTopic, setActiveModalTopic] = useState<{ topic: Topic; unit: Unit } | null>(null);

  // Group subtopics by topic_id
  const subtopicsByTopicId: Record<string, Subtopic[]> = {};
  subtopics.forEach((st) => {
    if (!subtopicsByTopicId[st.topic_id]) {
      subtopicsByTopicId[st.topic_id] = [];
    }
    subtopicsByTopicId[st.topic_id].push(st);
  });

  // Filter sections and topics based on search query
  const q = searchQuery.toLowerCase().trim();

  const filteredSections = units
    .map((unit) => {
      const unitTopics = topics.filter((t) => t.unit_id === unit.id);

      if (!q) {
        return {
          unit,
          topics: unitTopics,
        };
      }

      // Check unit match
      const unitMatches =
        unit.title.toLowerCase().includes(q) ||
        (unit.description && unit.description.toLowerCase().includes(q));

      // Filter topics: match topic or match any subtopic
      const matchingTopics = unitTopics.filter((t) => {
        if (unitMatches) return true;
        if (t.title.toLowerCase().includes(q)) return true;
        if (t.description && t.description.toLowerCase().includes(q)) return true;
        const topicSubtopics = subtopicsByTopicId[t.id] || [];
        return topicSubtopics.some((st) => st.title.toLowerCase().includes(q));
      });

      return {
        unit,
        topics: matchingTopics,
      };
    })
    .filter((g) => (!q ? true : g.topics.length > 0));

  return (
    <div className="space-y-6">
      {/* Syllabus Document Card at Top */}
      <SyllabusViewer syllabus={syllabus} onSyllabusUpdated={onSyllabusUpdated} />

      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Syllabus Curriculum & Topic Breakdown</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Nested three-level structure: Section → Topic → Individual Subtopics.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subtopics, topics, sections..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition"
          />
        </div>
      </div>

      {/* Nested Dropdown Sections List */}
      {filteredSections.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No topics match your search"
          description="Try modifying your keyword query or clear the search to view all sections."
        />
      ) : (
        <div className="space-y-4">
          {filteredSections.map(({ unit, topics: unitTopics }) => (
            <SectionDropdown
              key={unit.id}
              unit={unit}
              topics={unitTopics}
              subtopicsByTopicId={subtopicsByTopicId}
              completedSubtopicIds={completedSubtopicIds}
              onToggleSubtopicComplete={onToggleSubtopicComplete}
              onOpenResources={(topic, u) => setActiveModalTopic({ topic, unit: u })}
            />
          ))}
        </div>
      )}

      {/* Topic Details & Resources Modal */}
      {activeModalTopic && (
        <TopicDetailsModal
          isOpen={Boolean(activeModalTopic)}
          onClose={() => setActiveModalTopic(null)}
          topic={activeModalTopic.topic}
          unit={activeModalTopic.unit}
          isCompleted={
            (subtopicsByTopicId[activeModalTopic.topic.id] || []).length > 0 &&
            (subtopicsByTopicId[activeModalTopic.topic.id] || []).every((st) =>
              completedSubtopicIds.has(st.id)
            )
          }
          onToggleComplete={() => {
            // Toggle all subtopics for this topic
            const tSubs = subtopicsByTopicId[activeModalTopic.topic.id] || [];
            const allDone = tSubs.every((st) => completedSubtopicIds.has(st.id));
            tSubs.forEach((st) => {
              const isStDone = completedSubtopicIds.has(st.id);
              if (allDone && isStDone) {
                onToggleSubtopicComplete(st.id, true);
              } else if (!allDone && !isStDone) {
                onToggleSubtopicComplete(st.id, false);
              }
            });
          }}
        />
      )}
    </div>
  );
};
