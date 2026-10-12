import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  Resource,
  Topic,
  Unit,
  ResourceType,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_COLORS,
  RESOURCE_TYPES_WITH_ANSWER_KEY,
  RESOURCE_TYPES_WITH_YEAR,
  RESOURCE_TYPES_WITH_AUTHOR,
} from '../../types/database';
import {
  Plus,
  Trash2,
  Pencil,
  Upload,
  ExternalLink,
  Eye,
  Loader2,
  BookOpen,
  Search,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { PdfViewerModal } from '../common/PdfViewerModal';
import {
  createResource,
  updateResource,
  deleteResource,
  fetchTopicResources,
} from '../../lib/dataService';
import { uploadFileToStorage, MAX_UPLOAD_SIZE } from '../../lib/supabase';

interface ResourceManagerProps {
  resources: Resource[];
  topics: Topic[];
  units: Unit[];
  onResourcesChanged: () => void;
}

// ─── Upload Progress Bar ────────────────────────────────────────────────────

const UploadProgressBar = memo(({ percent }: { percent: number }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <span className="text-stone-600 font-medium flex items-center gap-1.5">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
        Uploading...
      </span>
      <span className="font-mono text-emerald-700 font-bold">{percent}%</span>
    </div>
    <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
      <div
        className="h-2 bg-emerald-600 rounded-full transition-all duration-200 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
));

// ─── Resource Row in admin list ──────────────────────────────────────────────

interface ResourceRowProps {
  res: Resource;
  linkedTopics: Topic[];
  allResources: Resource[];
  onEdit: (r: Resource) => void;
  onDelete: (r: Resource) => void;
  onView: (r: Resource) => void;
}

const ResourceRow = memo(({ res, linkedTopics, allResources, onEdit, onDelete, onView }: ResourceRowProps) => {
  const typeColor = RESOURCE_TYPE_COLORS[res.resource_type];
  const hasPdf = Boolean(res.storage_path);
  const answerKey = res.linked_answer_key_id
    ? allResources.find((r) => r.id === res.linked_answer_key_id)
    : null;

  const formatSize = (bytes: number | null) => {
    if (!bytes) return null;
    return bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-300 hover:shadow-xs transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-stone-100 flex-shrink-0 mt-0.5">
            <FileText className="w-4 h-4 text-emerald-800" />
          </div>

          <div className="min-w-0 flex-1">
            {/* Type + Year badge row */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}
              >
                {RESOURCE_TYPE_LABELS[res.resource_type]}
              </span>
              {res.exam_year && (
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                  {res.exam_year}
                </span>
              )}
              {res.paper_number && (
                <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                  #{res.paper_number}
                </span>
              )}
              {answerKey && (
                <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Ans. Key linked
                </span>
              )}
            </div>

            <h4 className="text-xs font-bold text-stone-900 truncate">{res.title}</h4>

            {/* Author / Publication */}
            {(res.author || res.publication || res.edition) && (
              <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                {[res.author, res.publication, res.edition && `Ed. ${res.edition}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}

            {/* File / URL info */}
            <div className="flex items-center gap-3 mt-1 text-[11px] text-stone-400">
              {hasPdf && res.file_name && (
                <span className="font-mono truncate max-w-[160px]">{res.file_name}</span>
              )}
              {formatSize(res.file_size) && (
                <span className="font-mono text-stone-400">{formatSize(res.file_size)}</span>
              )}
              {res.external_url && (
                <span className="text-emerald-700 truncate max-w-[200px]">🔗 {res.external_url}</span>
              )}
            </div>

            {/* Linked topics */}
            {linkedTopics.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {linkedTopics.slice(0, 3).map((t) => (
                  <span key={t.id} className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                    {t.title}
                  </span>
                ))}
                {linkedTopics.length > 3 && (
                  <span className="text-[10px] text-stone-400">+{linkedTopics.length - 3} more</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasPdf && (
            <button
              type="button"
              onClick={() => onView(res)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
              title="Preview PDF"
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </button>
          )}
          {res.external_url && (
            <a
              href={res.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
              title="Open external link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={() => onEdit(res)}
            className="p-1.5 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-100 transition"
            title="Edit resource"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(res)}
            className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition"
            title="Delete resource"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

// ─── Main ResourceManager component ─────────────────────────────────────────

export const ResourceManager: React.FC<ResourceManagerProps> = ({
  resources,
  topics,
  units,
  onResourcesChanged,
}) => {
  // Modal / delete state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [selectedPdfToView, setSelectedPdfToView] = useState<Resource | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('notes');
  const [sourceMode, setSourceMode] = useState<'url' | 'upload'>('upload');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  // Extended metadata
  const [author, setAuthor] = useState('');
  const [publication, setPublication] = useState('');
  const [examYear, setExamYear] = useState('');
  const [paperNumber, setPaperNumber] = useState('');
  const [edition, setEdition] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [linkedAnswerKeyId, setLinkedAnswerKeyId] = useState('');

  // Upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Op state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterUnitId, setFilterUnitId] = useState<string>('all');
  const [filterTopicId, setFilterTopicId] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [topicSearch, setTopicSearch] = useState('');

  // Topic<>Resource mapping (built from resources that have topic associations)
  // We maintain this locally to show linked topics in the row
  const [topicResourceMap, setTopicResourceMap] = useState<Record<string, string[]>>({});

  // ── Load initial topic<>resource mappings (once) ──
  React.useEffect(() => {
    let mounted = true;
    fetchTopicResources().then((mappings) => {
      if (!mounted) return;
      const map: Record<string, string[]> = {};
      mappings.forEach((m) => {
        if (!map[m.resource_id]) map[m.resource_id] = [];
        map[m.resource_id].push(m.topic_id);
      });
      setTopicResourceMap(map);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [resources]);

  // ── Derive unique exam years for filter ──
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    resources.forEach((r) => { if (r.exam_year) years.add(r.exam_year); });
    return Array.from(years).sort((a, b) => b - a);
  }, [resources]);

  // ── Topics available for filter based on selected unit ──
  const filterableTopics = useMemo(() => {
    return filterUnitId === 'all'
      ? topics
      : topics.filter((t) => t.unit_id === filterUnitId);
  }, [topics, filterUnitId]);

  // ── Filtered resource list ──
  const filteredResources = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return resources.filter((r) => {
      if (filterType !== 'all' && r.resource_type !== filterType) return false;
      if (filterYear !== 'all' && String(r.exam_year) !== filterYear) return false;
      if (filterTopicId !== 'all') {
        const linkedTopicIds = topicResourceMap[r.id] || [];
        if (!linkedTopicIds.includes(filterTopicId)) return false;
      }
      if (filterUnitId !== 'all' && filterTopicId === 'all') {
        const unitTopicIds = topics.filter((t) => t.unit_id === filterUnitId).map((t) => t.id);
        const linked = topicResourceMap[r.id] || [];
        if (!unitTopicIds.some((id) => linked.includes(id))) return false;
      }
      if (q) {
        const searchIn = [
          r.title,
          r.author,
          r.publication,
          r.file_name,
          String(r.exam_year || ''),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchIn.includes(q)) return false;
      }
      return true;
    });
  }, [resources, filterType, filterYear, filterTopicId, filterUnitId, searchQuery, topicResourceMap, topics]);

  // ── Topic selector filtered by search ──
  const modalTopics = useMemo(() => {
    const q = topicSearch.toLowerCase().trim();
    if (!q) return topics;
    return topics.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        units.find((u) => u.id === t.unit_id)?.title.toLowerCase().includes(q)
    );
  }, [topics, units, topicSearch]);

  // ── Answer key candidates (for linking) ──
  const answerKeyCandidates = useMemo(() => {
    return resources.filter((r) => r.resource_type === 'answer_key');
  }, [resources]);

  // ── Reset form ──
  const resetForm = useCallback(() => {
    setTitle('');
    setResourceType('notes');
    setSourceMode('upload');
    setExternalUrl('');
    setSelectedFile(null);
    setSelectedTopicIds([]);
    setAuthor('');
    setPublication('');
    setExamYear('');
    setPaperNumber('');
    setEdition('');
    setAdminNotes('');
    setLinkedAnswerKeyId('');
    setUploadProgress(null);
    setUploadError(null);
    setError(null);
    setTopicSearch('');
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingResource(null);
    resetForm();
    setIsModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback(async (res: Resource) => {
    setEditingResource(res);
    setTitle(res.title);
    setResourceType(res.resource_type);
    setSourceMode(res.storage_path ? 'upload' : 'url');
    setExternalUrl(res.external_url || '');
    setSelectedFile(null);
    setAuthor(res.author || '');
    setPublication(res.publication || '');
    setExamYear(res.exam_year ? String(res.exam_year) : '');
    setPaperNumber(res.paper_number || '');
    setEdition(res.edition || '');
    setAdminNotes(res.admin_notes || '');
    setLinkedAnswerKeyId(res.linked_answer_key_id || '');
    setUploadProgress(null);
    setUploadError(null);
    setError(null);
    setTopicSearch('');

    try {
      const mappings = await fetchTopicResources();
      const linked = mappings.filter((m) => m.resource_id === res.id).map((m) => m.topic_id);
      setSelectedTopicIds(linked);
    } catch {
      setSelectedTopicIds([]);
    }

    setIsModalOpen(true);
  }, []);

  const handleTopicToggle = useCallback((topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    // Validate immediately on select
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadError('Only PDF files are supported.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setUploadError(`File is too large (${mb} MB). Maximum is 50 MB.`);
      e.target.value = '';
      return;
    }
    if (file.size === 0) {
      setUploadError('Selected file is empty.');
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for this resource.');
      return;
    }
    if (sourceMode === 'url' && !externalUrl.trim()) {
      setError('Please enter an external URL or switch to PDF upload mode.');
      return;
    }
    if (sourceMode === 'upload' && !selectedFile && !editingResource?.storage_path) {
      setError('Please select a PDF file to upload.');
      return;
    }
    if (uploadError) {
      setError(uploadError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      let storagePath = editingResource?.storage_path || null;
      let fileName = editingResource?.file_name || null;
      let fileSize = editingResource?.file_size || null;

      // Upload new file if selected
      if (sourceMode === 'upload' && selectedFile) {
        setUploadProgress(0);
        try {
          const result = await uploadFileToStorage(selectedFile, 'resources', {
            onProgress: setUploadProgress,
          });
          if (result) {
            storagePath = result.storagePath;
            fileName = result.fileName;
            fileSize = result.fileSize;
          }
        } catch (uploadErr: unknown) {
          const msg = uploadErr instanceof Error ? uploadErr.message : 'Upload failed';
          setUploadError(msg);
          setError(`File upload failed: ${msg}. You can retry by submitting again.`);
          setUploadProgress(null);
          setSubmitting(false);
          return;
        }
        setUploadProgress(null);
      }

      const metadata = {
        title: title.trim(),
        resource_type: resourceType,
        external_url: sourceMode === 'url' ? externalUrl.trim() || null : null,
        storage_path: sourceMode === 'upload' ? storagePath : null,
        file_name: sourceMode === 'upload' ? fileName : null,
        file_size: sourceMode === 'upload' ? fileSize : null,
        author: author.trim() || null,
        publication: publication.trim() || null,
        exam_year: examYear ? parseInt(examYear, 10) : null,
        paper_number: paperNumber.trim() || null,
        edition: edition.trim() || null,
        admin_notes: adminNotes.trim() || null,
        linked_answer_key_id: linkedAnswerKeyId || null,
      };

      if (editingResource) {
        await updateResource(editingResource.id, metadata, selectedTopicIds);
        setSuccessMsg('Resource updated successfully.');
      } else {
        await createResource({ ...metadata, topic_ids: selectedTopicIds });
        setSuccessMsg('Resource added successfully.');
      }

      setIsModalOpen(false);
      onResourcesChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!resourceToDelete) return;
    try {
      setSubmitting(true);
      await deleteResource(resourceToDelete.id, resourceToDelete.storage_path);
      setResourceToDelete(null);
      onResourcesChanged();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete resource');
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = useCallback(() => {
    setFilterType('all');
    setFilterUnitId('all');
    setFilterTopicId('all');
    setFilterYear('all');
    setSearchQuery('');
  }, []);

  const hasActiveFilters =
    filterType !== 'all' ||
    filterUnitId !== 'all' ||
    filterTopicId !== 'all' ||
    filterYear !== 'all' ||
    searchQuery !== '';

  const showMetaSection =
    RESOURCE_TYPES_WITH_YEAR.includes(resourceType) ||
    RESOURCE_TYPES_WITH_AUTHOR.includes(resourceType) ||
    resourceType === 'test' ||
    resourceType === 'dpp';

  const showAnswerKeyLink = RESOURCE_TYPES_WITH_ANSWER_KEY.includes(resourceType);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-stone-900">Resource Library</h3>
          <p className="text-xs text-stone-500">
            Upload PDFs or link external resources. Associate each with one or more topics without duplicating files.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Resource
        </button>
      </div>

      {/* ── Filters row ── */}
      <div className="bg-stone-50 rounded-2xl border border-stone-200 p-3 space-y-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, filename…"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1 text-xs bg-white rounded-lg border border-stone-200 text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          >
            <option value="all">All Types</option>
            {Object.entries(RESOURCE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            value={filterUnitId}
            onChange={(e) => { setFilterUnitId(e.target.value); setFilterTopicId('all'); }}
            className="px-2.5 py-1 text-xs bg-white rounded-lg border border-stone-200 text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          >
            <option value="all">All Units</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.title}</option>
            ))}
          </select>

          {filterUnitId !== 'all' && filterableTopics.length > 0 && (
            <select
              value={filterTopicId}
              onChange={(e) => setFilterTopicId(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white rounded-lg border border-stone-200 text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            >
              <option value="all">All Topics</option>
              {filterableTopics.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          )}

          {availableYears.length > 0 && (
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white rounded-lg border border-stone-200 text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            >
              <option value="all">All Years</option>
              {availableYears.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 px-2 py-1 hover:bg-rose-50 rounded-lg transition"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}

          <span className="ml-auto text-xs text-stone-400 font-mono">
            {filteredResources.length}/{resources.length} shown
          </span>
        </div>
      </div>

      {/* ── Resource list ── */}
      {filteredResources.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-500">
            {hasActiveFilters ? 'No resources match your filters' : 'No resources yet'}
          </p>
          <p className="text-xs text-stone-400 mt-0.5">
            {hasActiveFilters
              ? 'Try adjusting or clearing your search / filters.'
              : 'Click "Add Resource" to upload your first study material.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredResources.map((res) => {
            const linkedTopicIds = topicResourceMap[res.id] || [];
            const linkedTopics = topics.filter((t) => linkedTopicIds.includes(t.id));
            return (
              <ResourceRow
                key={res.id}
                res={res}
                linkedTopics={linkedTopics}
                allResources={resources}
                onEdit={openEditModal}
                onDelete={setResourceToDelete}
                onView={setSelectedPdfToView}
              />
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { if (!submitting) setIsModalOpen(false); }}
        title={editingResource ? 'Edit Resource' : 'Add Study Resource'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Error banner */}
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── SECTION 1: Core info ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Resource Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. IIT-JAM 2023 Physical Chemistry PYQ"
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Resource Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value as ResourceType)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              >
                {Object.entries(RESOURCE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Source Format</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSourceMode('upload')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                    sourceMode === 'upload'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Upload PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('url')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                    sourceMode === 'url'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  External URL
                </button>
              </div>
            </div>
          </div>

          {/* ── File or URL input ── */}
          {sourceMode === 'upload' ? (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                PDF Document <span className="text-rose-500">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center transition ${
                  uploadError
                    ? 'border-rose-300 bg-rose-50'
                    : selectedFile
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-stone-300 bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <Upload className={`w-5 h-5 mx-auto mb-1.5 ${uploadError ? 'text-rose-400' : selectedFile ? 'text-emerald-600' : 'text-stone-400'}`} />
                <label className="cursor-pointer block">
                  <span className={`text-xs font-semibold ${uploadError ? 'text-rose-700' : selectedFile ? 'text-emerald-800' : 'text-emerald-800 hover:underline'}`}>
                    {selectedFile
                      ? `✓ ${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)`
                      : editingResource?.file_name
                      ? `Current: ${editingResource.file_name} — Click to replace`
                      : 'Click to select a PDF from your computer'}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={submitting}
                  />
                </label>
                {!selectedFile && (
                  <p className="text-[11px] text-stone-400 mt-0.5">PDF only · Max 50 MB</p>
                )}
              </div>
              {uploadError && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {uploadError}
                </p>
              )}
              {uploadProgress !== null && (
                <div className="mt-2">
                  <UploadProgressBar percent={uploadProgress} />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                External URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://archive.org/..."
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                required={sourceMode === 'url'}
              />
            </div>
          )}

          {/* ── SECTION 2: Metadata (contextual) ── */}
          {showMetaSection && (
            <div className="pt-3 border-t border-stone-100">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-2">
                Optional Metadata
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {RESOURCE_TYPES_WITH_YEAR.includes(resourceType) && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Exam Year</label>
                    <input
                      type="number"
                      value={examYear}
                      onChange={(e) => setExamYear(e.target.value)}
                      placeholder="2023"
                      min="2000"
                      max="2030"
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  </div>
                )}
                {(resourceType === 'dpp' || resourceType === 'test') && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Paper / DPP #</label>
                    <input
                      type="text"
                      value={paperNumber}
                      onChange={(e) => setPaperNumber(e.target.value)}
                      placeholder="01"
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    />
                  </div>
                )}
                {RESOURCE_TYPES_WITH_AUTHOR.includes(resourceType) && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Author</label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="J.D. Lee"
                        className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Publication</label>
                      <input
                        type="text"
                        value={publication}
                        onChange={(e) => setPublication(e.target.value)}
                        placeholder="Wiley"
                        className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Edition</label>
                      <input
                        type="text"
                        value={edition}
                        onChange={(e) => setEdition(e.target.value)}
                        placeholder="5th"
                        className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Answer key association ── */}
          {showAnswerKeyLink && answerKeyCandidates.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Link Answer Key (optional)
              </label>
              <select
                value={linkedAnswerKeyId}
                onChange={(e) => setLinkedAnswerKeyId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              >
                <option value="">— No answer key linked —</option>
                {answerKeyCandidates.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} {r.exam_year ? `(${r.exam_year})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Students will see a "Answer Key Available" badge on this material.
              </p>
            </div>
          )}

          {/* ── Admin notes ── */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Internal Notes (admin only)
            </label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Focus on Q.5–12 for thermodynamics; original Kota sheet"
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 resize-none"
            />
          </div>

          {/* ── Topic associations ── */}
          <div className="pt-2 border-t border-stone-100">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Associate with Topics
            </label>
            <p className="text-[11px] text-stone-400 mb-2">
              This resource will appear under each checked topic without duplicating the file.
            </p>

            {/* Topic search within modal */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                placeholder="Search topics…"
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>

            <div className="max-h-44 overflow-y-auto border border-stone-200 rounded-xl p-3 bg-stone-50/50 space-y-3">
              {units.map((u) => {
                const unitTopics = modalTopics.filter((t) => t.unit_id === u.id);
                if (unitTopics.length === 0) return null;
                return (
                  <div key={u.id} className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      {u.title}
                    </span>
                    <div className="space-y-0.5">
                      {unitTopics.map((t) => (
                        <label
                          key={t.id}
                          className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer hover:text-stone-900 select-none py-0.5 px-1 rounded hover:bg-white transition"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTopicIds.includes(t.id)}
                            onChange={() => handleTopicToggle(t.id)}
                            className="rounded text-emerald-700 focus:ring-emerald-700/20"
                          />
                          <span className="truncate">{t.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
              {modalTopics.length === 0 && (
                <p className="text-xs text-stone-400 text-center py-3">No topics match your search.</p>
              )}
            </div>
            {selectedTopicIds.length > 0 && (
              <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                ✓ {selectedTopicIds.length} topic{selectedTopicIds.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || Boolean(uploadError)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-400 text-white rounded-lg text-xs font-semibold transition"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {submitting
                  ? uploadProgress !== null
                    ? `Uploading ${uploadProgress}%…`
                    : 'Saving…'
                  : editingResource
                  ? 'Save Changes'
                  : 'Add Resource'}
              </span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Delete ── */}
      {resourceToDelete && (
        <ConfirmModal
          isOpen={Boolean(resourceToDelete)}
          onClose={() => setResourceToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Resource?"
          message={`Delete "${resourceToDelete.title}"? It will be removed from all topics and the PDF will be deleted from storage.`}
          confirmLabel="Delete Resource"
          isLoading={submitting}
        />
      )}

      {/* ── PDF Viewer ── */}
      {selectedPdfToView && (
        <PdfViewerModal
          isOpen={Boolean(selectedPdfToView)}
          onClose={() => setSelectedPdfToView(null)}
          title={selectedPdfToView.title}
          storagePath={selectedPdfToView.storage_path}
          fileName={selectedPdfToView.file_name}
        />
      )}

      {/* ── Success toast ── */}
      {successMsg && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-fade-in-up">
          <CheckCircle2 className="w-4 h-4" />
          {successMsg}
          <button type="button" onClick={() => setSuccessMsg(null)} className="ml-1 text-emerald-200 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
