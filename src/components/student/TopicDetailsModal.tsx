import React, { useEffect, useState } from 'react';
import { Topic, Unit, Resource } from '../../types/database';
import { Modal } from '../common/Modal';
import { ResourceList } from '../resources/ResourceList';
import { fetchTopicResources } from '../../lib/dataService';
import { CheckCircle2, Circle, Loader2, Layers } from 'lucide-react';

interface TopicDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: Topic | null;
  unit?: Unit | null;
  isCompleted: boolean;
  onToggleComplete: (topicId: string, isCompleted: boolean) => void;
}

export const TopicDetailsModal: React.FC<TopicDetailsModalProps> = ({
  isOpen,
  onClose,
  topic,
  unit,
  isCompleted,
  onToggleComplete,
}) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !topic) return;

    let isMounted = true;
    setLoading(true);

    const loadResources = async () => {
      try {
        const mappings = await fetchTopicResources(topic.id);
        if (isMounted) {
          const list = mappings.map((m) => m.resource).filter(Boolean) as Resource[];
          setResources(list);
        }
      } catch (err) {
        console.error('Failed to load topic resources:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadResources();

    return () => {
      isMounted = false;
    };
  }, [isOpen, topic]);

  if (!topic) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={topic.title}
      description={unit ? `Part of ${unit.title}` : undefined}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Topic details and completion toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-semibold text-stone-700">Topic Study Status</span>
            </div>
            {topic.description && (
              <p className="text-xs text-stone-600 max-w-md">{topic.description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onToggleComplete(topic.id, isCompleted)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-xs ${
              isCompleted
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-white hover:bg-emerald-50 text-stone-700 border border-stone-300'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Marked Complete</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 text-stone-400" />
                <span>Mark as Complete</span>
              </>
            )}
          </button>
        </div>

        {/* Resources Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Attached Study Materials ({resources.length})
            </h4>
            <span className="text-[11px] text-stone-500">Free order: Choose which material suits you</span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center text-stone-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
            </div>
          ) : (
            <ResourceList resources={resources} />
          )}
        </div>
      </div>
    </Modal>
  );
};
