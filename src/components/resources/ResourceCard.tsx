import React, { memo } from 'react';
import {
  Resource,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_COLORS,
} from '../../types/database';
import { Video, FileText, ExternalLink, Eye, Download, CheckCircle2, Key } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  linkedAnswerKey?: Resource | null;
  onViewPdf: (resource: Resource) => void;
}

function formatFileSize(bytes?: number | null): string | null {
  if (!bytes) return null;
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

export const ResourceCard: React.FC<ResourceCardProps> = memo(({
  resource,
  linkedAnswerKey,
  onViewPdf,
}) => {
  const isVideo = resource.resource_type === 'lecture_video';
  const hasPdf = Boolean(resource.storage_path);
  const typeColor = RESOURCE_TYPE_COLORS[resource.resource_type] || RESOURCE_TYPE_COLORS.other;

  const metaLine = [
    resource.author,
    resource.publication,
    resource.edition && `Ed. ${resource.edition}`,
    resource.exam_year && `JAM ${resource.exam_year}`,
    resource.paper_number && `#${resource.paper_number}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="group bg-white rounded-xl border border-stone-200 p-4 hover:border-emerald-300 hover:shadow-sm transition duration-150 flex flex-col justify-between">
      <div>
        {/* Type Badge + size */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}
          >
            {isVideo ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
            {RESOURCE_TYPE_LABELS[resource.resource_type]}
          </span>
          <div className="flex items-center gap-1.5">
            {resource.exam_year && (
              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                {resource.exam_year}
              </span>
            )}
            {formatFileSize(resource.file_size) && (
              <span className="text-[10px] text-stone-400 font-mono">
                {formatFileSize(resource.file_size)}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h4 className="text-xs font-semibold text-stone-900 group-hover:text-emerald-950 transition line-clamp-2 leading-relaxed">
          {resource.resource_type === 'answer_key' && (
            <span className="inline-flex items-center gap-0.5 text-teal-700 mr-1">
              <Key className="w-3 h-3" />
            </span>
          )}
          {resource.title}
        </h4>

        {/* Meta line (author / pub / year / paper) */}
        {metaLine && (
          <p className="text-[11px] text-stone-500 mt-1 truncate leading-relaxed">
            {metaLine}
          </p>
        )}

        {/* Answer key badge */}
        {linkedAnswerKey && (
          <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Answer Key: {linkedAnswerKey.title}
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-2 flex-wrap">
        {hasPdf && (
          <>
            <button
              type="button"
              onClick={() => onViewPdf(resource)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition"
            >
              <Eye className="w-3.5 h-3.5" />
              View PDF
            </button>
          </>
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

        {/* View answer key shortcut */}
        {linkedAnswerKey && (
          <button
            type="button"
            onClick={() => onViewPdf(linkedAnswerKey)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg transition ml-auto"
          >
            <Key className="w-3.5 h-3.5" />
            View Answer Key
          </button>
        )}
      </div>
    </div>
  );
});
