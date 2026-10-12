import React, { useState } from 'react';
import { Resource, ResourceType, RESOURCE_TYPE_LABELS } from '../../types/database';
import { ResourceCard } from './ResourceCard';
import { PdfViewerModal } from '../common/PdfViewerModal';
import { EmptyState } from '../common/EmptyState';
import { BookOpen } from 'lucide-react';

interface ResourceListProps {
  resources: Resource[];
  showAdminActions?: boolean;
  onEditResource?: (res: Resource) => void;
  onDeleteResource?: (res: Resource) => void;
  onAddResource?: () => void;
}

export const ResourceList: React.FC<ResourceListProps> = ({
  resources,
  showAdminActions = false,
  onEditResource,
  onDeleteResource,
  onAddResource,
}) => {
  const [selectedPdfResource, setSelectedPdfResource] = useState<Resource | null>(null);

  if (resources.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No resources attached yet"
        description="There are currently no notes, videos, or DPPs assigned to this topic."
        action={
          showAdminActions && onAddResource
            ? {
                label: '+ Attach Resource',
                onClick: onAddResource,
              }
            : undefined
        }
      />
    );
  }

  // Group resources by type category
  const order: ResourceType[] = [
    'lecture_video',
    'notes',
    'book',
    'dpp',
    'pyq',
    'test',
    'answer_key',
    'other',
  ];

  const grouped = order
    .map((type) => ({
      type,
      label: RESOURCE_TYPE_LABELS[type],
      items: resources.filter((r) => r.resource_type === type),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.type} className="space-y-3">
          <div className="flex items-center gap-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              {group.label} ({group.items.length})
            </h5>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.items.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                onViewPdf={(r) => setSelectedPdfResource(r)}
                showAdminActions={showAdminActions}
                onEdit={onEditResource}
                onDelete={onDeleteResource}
              />
            ))}
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
};
