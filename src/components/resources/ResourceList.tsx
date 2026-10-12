import React, { useState, useMemo, memo } from 'react';
import { Resource, ResourceType, RESOURCE_TYPE_LABELS } from '../../types/database';
import { ResourceCard } from './ResourceCard';
import { PdfViewerModal } from '../common/PdfViewerModal';
import { EmptyState } from '../common/EmptyState';
import { BookOpen } from 'lucide-react';

interface ResourceListProps {
  resources: Resource[];
  /** If provided, the ResourceCard will display linked answer keys inline */
  showAnswerKeys?: boolean;
  onAddResource?: () => void;
}

const TYPE_ORDER: ResourceType[] = [
  'lecture_video',
  'notes',
  'book',
  'dpp',
  'pyq',
  'test',
  'answer_key',
  'other',
];

export const ResourceList: React.FC<ResourceListProps> = memo(({
  resources,
  showAnswerKeys = true,
  onAddResource,
}) => {
  const [selectedPdfResource, setSelectedPdfResource] = useState<Resource | null>(null);

  // Build answer key lookup map
  const answerKeyMap = useMemo(() => {
    const map: Record<string, Resource> = {};
    resources.forEach((r) => {
      if (r.resource_type === 'answer_key') map[r.id] = r;
    });
    return map;
  }, [resources]);

  // Exclude answer_key resources from main grid (they're surfaced via the linked badge)
  const primaryResources = useMemo(() => {
    if (!showAnswerKeys) return resources;
    // Show everything; answer keys appear in their own group too for direct access
    return resources;
  }, [resources, showAnswerKeys]);

  if (primaryResources.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No resources attached yet"
        description="There are currently no notes, videos, DPPs, or PYQs assigned to this topic."
        action={onAddResource ? { label: '+ Attach Resource', onClick: onAddResource } : undefined}
      />
    );
  }

  const grouped = TYPE_ORDER
    .map((type) => ({
      type,
      label: RESOURCE_TYPE_LABELS[type],
      items: primaryResources.filter((r) => r.resource_type === type),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.type} className="space-y-3">
          <div className="flex items-center gap-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              {group.label}
              <span className="ml-1.5 text-stone-400 font-normal normal-case">({group.items.length})</span>
            </h5>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.items.map((res) => {
              const linkedKey =
                showAnswerKeys && res.linked_answer_key_id
                  ? answerKeyMap[res.linked_answer_key_id] || null
                  : null;

              return (
                <ResourceCard
                  key={res.id}
                  resource={res}
                  linkedAnswerKey={linkedKey}
                  onViewPdf={(r) => setSelectedPdfResource(r)}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* PDF Viewer modal */}
      {selectedPdfResource && (
        <PdfViewerModal
          isOpen={Boolean(selectedPdfResource)}
          onClose={() => setSelectedPdfResource(null)}
          title={selectedPdfResource.title}
          storagePath={selectedPdfResource.storage_path}
          fileName={selectedPdfResource.file_name}
        />
      )}
    </div>
  );
});
