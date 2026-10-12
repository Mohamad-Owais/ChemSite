import React from 'react';
import { Resource, RESOURCE_TYPE_LABELS, RESOURCE_TYPE_COLORS } from '../../types/database';
import { Video, FileText, ExternalLink, Eye } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  onViewPdf: (resource: Resource) => void;
  showAdminActions?: boolean;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onViewPdf,
  showAdminActions = false,
  onEdit,
  onDelete,
}) => {
  const isVideo = resource.resource_type === 'lecture_video';
  const hasPdf = Boolean(resource.storage_path);
  const typeColor = RESOURCE_TYPE_COLORS[resource.resource_type] || RESOURCE_TYPE_COLORS.other;

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="group bg-white rounded-xl border border-stone-200 p-4 hover:border-emerald-300 hover:shadow-xs transition duration-150 flex flex-col justify-between">
      <div>
        {/* Type Badge & Meta */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}
          >
            {isVideo ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
            {RESOURCE_TYPE_LABELS[resource.resource_type]}
          </span>
          {formatFileSize(resource.file_size) && (
            <span className="text-[11px] text-stone-400 font-mono">
              {formatFileSize(resource.file_size)}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-stone-900 group-hover:text-emerald-950 transition line-clamp-2">
          {resource.title}
        </h4>
      </div>

      {/* Action footer */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        {hasPdf && (
          <button
            type="button"
            onClick={() => onViewPdf(resource)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition"
          >
            <Eye className="w-3.5 h-3.5" />
            View Document
          </button>
        )}

        {isVideo && resource.external_url && (
          <a
            href={resource.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Watch Lecture
          </a>
        )}

        {!isVideo && !hasPdf && resource.external_url && (
          <a
            href={resource.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Link
          </a>
        )}

        {showAdminActions && (
          <div className="flex items-center gap-1.5 ml-auto">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(resource)}
                className="text-xs text-stone-500 hover:text-stone-900 px-2 py-1 hover:bg-stone-100 rounded font-medium transition"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(resource)}
                className="text-xs text-rose-600 hover:text-rose-800 px-2 py-1 hover:bg-rose-50 rounded font-medium transition"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
