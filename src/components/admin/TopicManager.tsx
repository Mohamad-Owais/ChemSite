import React, { useState } from 'react';
import { Unit, Topic } from '../../types/database';
import { BookOpen, Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { createTopic, updateTopic, deleteTopic } from '../../lib/dataService';

interface TopicManagerProps {
  units: Unit[];
  topics: Topic[];
  onTopicsChanged: () => void;
}

export const TopicManager: React.FC<TopicManagerProps> = ({
  units,
  topics,
  onTopicsChanged,
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);

  const [unitId, setUnitId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingTopic(null);
    setUnitId(selectedUnitId !== 'all' ? selectedUnitId : units[0]?.id || '');
    setTitle('');
    setDescription('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Topic) => {
    setEditingTopic(t);
    setUnitId(t.unit_id);
    setTitle(t.title);
    setDescription(t.description || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Topic title is required.');
      return;
    }
    if (!unitId) {
      setError('Please select a unit for this topic.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingTopic) {
        await updateTopic(editingTopic.id, {
          unit_id: unitId,
          title: title.trim(),
          description: description.trim() || null,
        });
      } else {
        await createTopic(unitId, title.trim(), description.trim() || undefined);
      }

      setIsModalOpen(false);
      onTopicsChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!topicToDelete) return;

    try {
      setSubmitting(true);
      await deleteTopic(topicToDelete.id);
      setTopicToDelete(null);
      onTopicsChanged();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete topic');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTopics = selectedUnitId === 'all'
    ? topics
    : topics.filter((t) => t.unit_id === selectedUnitId);

  const moveOrder = async (topicList: Topic[], index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= topicList.length) return;

    const current = topicList[index];
    const target = topicList[targetIndex];

    try {
      await updateTopic(current.id, { order_index: target.order_index });
      await updateTopic(target.id, { order_index: current.order_index });
      onTopicsChanged();
    } catch (err) {
      console.error('Failed to reorder topics:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-stone-900">Topics Management</h3>
          <p className="text-xs text-stone-500">
            Create and organize granular topics under each syllabus unit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Unit selector filter */}
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white rounded-xl border border-stone-200 text-stone-700 focus:outline-hidden"
          >
            <option value="all">All Units ({topics.length} topics)</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={units.length === 0}
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Topic</span>
          </button>
        </div>
      </div>

      {units.length === 0 ? (
        <div className="p-8 text-center text-xs text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
          Please create at least one unit before adding topics.
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="p-8 text-center text-xs text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
          No topics in this unit yet. Click "Add Topic" to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTopics.map((topic, index) => {
            const unit = units.find((u) => u.id === topic.unit_id);

            return (
              <div
                key={topic.id}
                className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-stone-100 text-stone-600 flex-shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-emerald-800" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {unit && (
                        <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                          {unit.title}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-stone-900 truncate">{topic.title}</h4>
                    {topic.description && (
                      <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">{topic.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveOrder(filteredTopics, index, 'up')}
                    className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-30 rounded hover:bg-stone-100 transition"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === filteredTopics.length - 1}
                    onClick={() => moveOrder(filteredTopics, index, 'down')}
                    className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-30 rounded hover:bg-stone-100 transition"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(topic)}
                    className="p-1.5 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-100 transition"
                    title="Edit Topic"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopicToDelete(topic)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition"
                    title="Delete Topic"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create or Edit Topic */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTopic ? 'Edit Topic' : 'Create New Topic'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Belongs to Unit <span className="text-rose-500">*</span>
            </label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              required
            >
              <option value="">Select unit...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Topic Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Phase equilibria in one-component systems"
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Topic Scope / Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key sub-topics, numerical practice areas, or focus points..."
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
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
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
            >
              {submitting ? 'Saving...' : editingTopic ? 'Save Changes' : 'Create Topic'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Topic Modal */}
      {topicToDelete && (
        <ConfirmModal
          isOpen={Boolean(topicToDelete)}
          onClose={() => setTopicToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Topic?"
          message={`Are you sure you want to delete "${topicToDelete.title}"? Schedule assignments and topic completion marks will be removed. All shared resources in the library will remain safe.`}
          confirmLabel="Delete Topic"
          isLoading={submitting}
        />
      )}
    </div>
  );
};
