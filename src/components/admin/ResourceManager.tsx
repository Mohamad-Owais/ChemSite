import React, { useState } from 'react';
import {
  Resource,
  Topic,
  Unit,
  ResourceType,
  RESOURCE_TYPE_LABELS,
} from '../../types/database';
import { Plus, Trash2, Pencil, Upload, ExternalLink, Eye, Loader2, BookOpen } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { PdfViewerModal } from '../common/PdfViewerModal';
import {
  createResource,
  updateResource,
  deleteResource,
  fetchTopicResources,
} from '../../lib/dataService';
import { uploadFileToStorage } from '../../lib/supabase';

interface ResourceManagerProps {
  resources: Resource[];
  topics: Topic[];
  units: Unit[];
  onResourcesChanged: () => void;
}

export const ResourceManager: React.FC<ResourceManagerProps> = ({
  resources,
  topics,
  units,
  onResourcesChanged,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [selectedPdfToView, setSelectedPdfToView] = useState<Resource | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('notes');
  const [sourceMode, setSourceMode] = useState<'url' | 'upload'>('url');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const openCreateModal = () => {
    setEditingResource(null);
    setTitle('');
    setResourceType('notes');
    setSourceMode('url');
    setExternalUrl('');
    setSelectedFile(null);
    setSelectedTopicIds([]);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (res: Resource) => {
    setEditingResource(res);
    setTitle(res.title);
    setResourceType(res.resource_type);
    setSourceMode(res.storage_path ? 'upload' : 'url');
    setExternalUrl(res.external_url || '');
    setSelectedFile(null);
    setError(null);

    // Fetch existing topic mappings for this resource
    try {
      const mappings = await fetchTopicResources();
      const linkedTopicIds = mappings
        .filter((m) => m.resource_id === res.id)
        .map((m) => m.topic_id);
      setSelectedTopicIds(linkedTopicIds);
    } catch {
      setSelectedTopicIds([]);
    }

    setIsModalOpen(true);
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for the resource.');
      return;
    }

    if (sourceMode === 'url' && !externalUrl.trim()) {
      setError('Please provide a valid web link or video URL.');
      return;
    }

    if (sourceMode === 'upload' && !selectedFile && !editingResource?.storage_path) {
      setError('Please choose a PDF document to upload.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      let storagePath = editingResource?.storage_path || null;
      let fileName = editingResource?.file_name || null;
      let fileSize = editingResource?.file_size || null;

      // Handle file upload if a new file is chosen
      if (sourceMode === 'upload' && selectedFile) {
        const uploadResult = await uploadFileToStorage(selectedFile, 'resources');
        if (uploadResult) {
          storagePath = uploadResult.storagePath;
          fileName = uploadResult.fileName;
          fileSize = uploadResult.fileSize;
        }
      }

      if (editingResource) {
        await updateResource(
          editingResource.id,
          {
            title: title.trim(),
            resource_type: resourceType,
            external_url: sourceMode === 'url' ? externalUrl.trim() : null,
            storage_path: sourceMode === 'upload' ? storagePath : null,
            file_name: sourceMode === 'upload' ? fileName : null,
            file_size: sourceMode === 'upload' ? fileSize : null,
          },
          selectedTopicIds
        );
      } else {
        await createResource({
          title: title.trim(),
          resource_type: resourceType,
          external_url: sourceMode === 'url' ? externalUrl.trim() : null,
          storage_path: sourceMode === 'upload' ? storagePath : null,
          file_name: sourceMode === 'upload' ? fileName : null,
          file_size: sourceMode === 'upload' ? fileSize : null,
          topic_ids: selectedTopicIds,
        });
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

  const filteredResources = filterType === 'all'
    ? resources
    : resources.filter((r) => r.resource_type === filterType);

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-stone-900">Resource Library & Topic Associations</h3>
          <p className="text-xs text-stone-500">
            Upload PDFs or save lecture URLs once, then associate them with multiple syllabus topics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white rounded-xl border border-stone-200 text-stone-700 focus:outline-hidden"
          >
            <option value="all">All Resource Types ({resources.length})</option>
            {Object.entries(RESOURCE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Resource</span>
          </button>
        </div>
      </div>

      {/* Resource Table / List */}
      {filteredResources.length === 0 ? (
        <div className="p-8 text-center text-xs text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
          No resources found. Click "Add Resource" to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredResources.map((res) => {
            const hasPdf = Boolean(res.storage_path);

            return (
              <div
                key={res.id}
                className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-stone-100 text-stone-700 flex-shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-emerald-800" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                        {RESOURCE_TYPE_LABELS[res.resource_type]}
                      </span>
                      {res.file_name && (
                        <span className="text-[10px] text-stone-400 font-mono truncate">
                          {res.file_name}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-stone-900 truncate">{res.title}</h4>
                    {res.external_url && (
                      <p className="text-[11px] text-emerald-700 font-mono truncate hover:underline mt-0.5">
                        {res.external_url}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {hasPdf && (
                    <button
                      type="button"
                      onClick={() => setSelectedPdfToView(res)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
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
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => openEditModal(res)}
                    className="p-1.5 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-100 transition"
                    title="Edit Resource"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setResourceToDelete(res)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create or Edit Resource */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingResource ? 'Edit Resource' : 'Add Study Resource'}
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Resource Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 4 Notes — Phase Equilibria and Clapeyron Equation"
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Resource Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value as ResourceType)}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              >
                {Object.entries(RESOURCE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Source Format</label>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSourceMode('url')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
                    sourceMode === 'url'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  External URL
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('upload')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
                    sourceMode === 'upload'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Upload PDF
                </button>
              </div>
            </div>
          </div>

          {/* Conditional Input based on sourceMode */}
          {sourceMode === 'url' ? (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                External Video / Web URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://archive.org/..."
                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                required={sourceMode === 'url'}
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                PDF Document File <span className="text-rose-500">*</span>
              </label>
              <div className="border border-dashed border-stone-300 rounded-xl p-4 text-center bg-stone-50/50 hover:bg-stone-50 transition">
                <Upload className="w-5 h-5 mx-auto text-stone-400 mb-1" />
                <label className="cursor-pointer">
                  <span className="text-xs font-semibold text-emerald-800 hover:underline">
                    {selectedFile
                      ? selectedFile.name
                      : editingResource?.file_name
                      ? `Replace ${editingResource.file_name}`
                      : 'Choose a PDF from your computer'}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                    }}
                  />
                </label>
                <p className="text-[11px] text-stone-400 mt-0.5">Maximum file size 50MB (PDF only)</p>
              </div>
            </div>
          )}

          {/* Topic Associations (One-to-Many without duplicate upload) */}
          <div className="pt-2 border-t border-stone-100">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Associate with Topics (Select all relevant topics)
            </label>
            <p className="text-[11px] text-stone-500 mb-2">
              This material will appear under each checked topic without duplicating the file.
            </p>

            <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl p-3 bg-stone-50/50 space-y-3">
              {units.map((u) => {
                const unitTopics = topics.filter((t) => t.unit_id === u.id);
                if (unitTopics.length === 0) return null;

                return (
                  <div key={u.id} className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      {u.title}
                    </span>
                    <div className="space-y-1">
                      {unitTopics.map((t) => {
                        const checked = selectedTopicIds.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer hover:text-stone-900 select-none py-0.5"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleTopicToggle(t.id)}
                              className="rounded text-emerald-700 focus:ring-emerald-700/20"
                            />
                            <span>{t.title}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{submitting ? 'Saving...' : editingResource ? 'Save Changes' : 'Add Resource'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Resource */}
      {resourceToDelete && (
        <ConfirmModal
          isOpen={Boolean(resourceToDelete)}
          onClose={() => setResourceToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Resource?"
          message={`Are you sure you want to delete "${resourceToDelete.title}"? It will be removed from all associated topics.`}
          confirmLabel="Delete Resource"
          isLoading={submitting}
        />
      )}

      {/* View PDF Modal */}
      {selectedPdfToView && (
        <PdfViewerModal
          isOpen={Boolean(selectedPdfToView)}
          onClose={() => setSelectedPdfToView(null)}
          title={selectedPdfToView.title}
          storagePath={selectedPdfToView.storage_path}
          fileName={selectedPdfToView.file_name}
        />
      )}
    </div>
  );
};
