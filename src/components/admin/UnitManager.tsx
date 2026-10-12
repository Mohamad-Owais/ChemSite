import React, { useState } from 'react';
import { Unit } from '../../types/database';
import { Layers, Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { createUnit, updateUnit, deleteUnit } from '../../lib/dataService';

interface UnitManagerProps {
  units: Unit[];
  onUnitsChanged: () => void;
}

export const UnitManager: React.FC<UnitManagerProps> = ({ units, onUnitsChanged }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingUnit(null);
    setTitle('');
    setDescription('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setTitle(unit.title);
    setDescription(unit.description || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Unit title is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingUnit) {
        await updateUnit(editingUnit.id, {
          title: title.trim(),
          description: description.trim() || null,
        });
      } else {
        await createUnit(title.trim(), description.trim() || undefined);
      }

      setIsModalOpen(false);
      onUnitsChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!unitToDelete) return;

    try {
      setSubmitting(true);
      await deleteUnit(unitToDelete.id);
      setUnitToDelete(null);
      onUnitsChanged();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete unit');
    } finally {
      setSubmitting(false);
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= units.length) return;

    const current = units[index];
    const target = units[targetIndex];

    try {
      await updateUnit(current.id, { order_index: target.order_index });
      await updateUnit(target.id, { order_index: current.order_index });
      onUnitsChanged();
    } catch (err) {
      console.error('Failed to reorder units:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-stone-900">Units Management</h3>
          <p className="text-xs text-stone-500">
            Define syllabus units (e.g. Chemical Thermodynamics, Bonding, Reaction Mechanisms).
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Unit</span>
        </button>
      </div>

      <div className="space-y-2">
        {units.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
            No units created yet. Click "Add Unit" above.
          </div>
        ) : (
          units.map((unit, index) => (
            <div
              key={unit.id}
              className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition flex items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 flex-shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 truncate">{unit.title}</h4>
                  {unit.description && (
                    <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">{unit.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveOrder(index, 'up')}
                  className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-30 rounded hover:bg-stone-100 transition"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === units.length - 1}
                  onClick={() => moveOrder(index, 'down')}
                  className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-30 rounded hover:bg-stone-100 transition"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(unit)}
                  className="p-1.5 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-100 transition"
                  title="Edit Unit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setUnitToDelete(unit)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition"
                  title="Delete Unit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create or Edit Unit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUnit ? 'Edit Unit' : 'Create New Unit'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Unit Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 4: Bioinorganic Chemistry"
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key sub-areas, reference texts, or concepts in this unit..."
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
              {submitting ? 'Saving...' : editingUnit ? 'Save Changes' : 'Create Unit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      {unitToDelete && (
        <ConfirmModal
          isOpen={Boolean(unitToDelete)}
          onClose={() => setUnitToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Unit?"
          message={`Are you sure you want to delete "${unitToDelete.title}"? All associated topics will be removed, but shared resources will remain in the library.`}
          confirmLabel="Delete Unit"
          isLoading={submitting}
        />
      )}
    </div>
  );
};
