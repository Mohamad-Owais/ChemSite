import React, { useState } from 'react';
import { Unit, Topic, StudySchedule } from '../../types/database';
import { Calendar, Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { createSchedule, updateSchedule, deleteSchedule } from '../../lib/dataService';

interface ScheduleManagerProps {
  units: Unit[];
  topics: Topic[];
  schedules: StudySchedule[];
  onSchedulesChanged: () => void;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  units,
  topics,
  schedules,
  onSchedulesChanged,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<StudySchedule | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<StudySchedule | null>(null);

  const [topicId, setTopicId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingSchedule(null);
    setTopicId(topics[0]?.id || '');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (s: StudySchedule) => {
    setEditingSchedule(s);
    setTopicId(s.topic_id);
    setScheduledDate(s.scheduled_date);
    setNotes(s.notes || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId) {
      setError('Please select a topic to schedule.');
      return;
    }
    if (!scheduledDate) {
      setError('Please select a calendar date.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, scheduledDate, notes.trim() || undefined);
      } else {
        await createSchedule(topicId, scheduledDate, notes.trim() || undefined);
      }

      setIsModalOpen(false);
      onSchedulesChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!scheduleToDelete) return;

    try {
      setSubmitting(true);
      await deleteSchedule(scheduleToDelete.id);
      setScheduleToDelete(null);
      onSchedulesChanged();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete schedule entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-stone-900">Daily Study Planner & Assignments</h3>
          <p className="text-xs text-stone-500">
            Assign topics to specific dates as daily study reminders for the student.
          </p>
        </div>

        <button
          type="button"
          disabled={topics.length === 0}
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Topic</span>
        </button>
      </div>

      {topics.length === 0 ? (
        <div className="p-8 text-center text-xs text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
          No topics available to schedule. Please add units and topics first.
        </div>
      ) : schedules.length === 0 ? (
        <div className="p-8 text-center text-xs text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
          No schedule entries exist yet. Click "Schedule Topic" to set up a study date.
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map((item) => {
            const topic = item.topic || topics.find((t) => t.id === item.topic_id);
            const unit = item.unit || (topic ? units.find((u) => u.id === topic.unit_id) : undefined);

            const dateFormatted = new Date(item.scheduled_date + 'T00:00:00').toLocaleDateString(
              'en-US',
              {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }
            );

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 flex-shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[11px] font-bold text-emerald-900 bg-emerald-100/60 px-2 py-0.5 rounded font-mono">
                        {dateFormatted}
                      </span>
                      {unit && (
                        <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded truncate">
                          {unit.title}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-stone-900 truncate">
                      {topic ? topic.title : 'Unknown topic'}
                    </h4>

                    {item.notes && (
                      <p className="text-[11px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block border border-amber-200">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-1.5 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-100 transition"
                    title="Edit Schedule Entry"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleToDelete(item)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition"
                    title="Delete Schedule Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create or Edit Schedule Entry */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? 'Edit Schedule Assignment' : 'Schedule Topic for Date'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Topic to Assign <span className="text-rose-500">*</span>
            </label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              disabled={Boolean(editingSchedule)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 disabled:bg-stone-100"
              required
            >
              <option value="">Select topic...</option>
              {units.map((u) => {
                const unitTopics = topics.filter((t) => t.unit_id === u.id);
                if (unitTopics.length === 0) return null;

                return (
                  <optgroup key={u.id} label={u.title}>
                    {unitTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Scheduled Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Study Guidance / Notes for Student (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on MO diagrams and Walsh diagrams; solve DPP #01 before bedtime."
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
              {submitting ? 'Saving...' : editingSchedule ? 'Save Changes' : 'Assign to Date'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Schedule Modal */}
      {scheduleToDelete && (
        <ConfirmModal
          isOpen={Boolean(scheduleToDelete)}
          onClose={() => setScheduleToDelete(null)}
          onConfirm={handleDelete}
          title="Remove Schedule Entry?"
          message="Are you sure you want to remove this scheduled study assignment? Note: Any completion mark the student recorded for this topic is safely preserved."
          confirmLabel="Remove Entry"
          isLoading={submitting}
        />
      )}
    </div>
  );
};
