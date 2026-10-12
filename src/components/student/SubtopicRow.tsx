import React from 'react';
import { Subtopic } from '../../types/database';
import { CheckCircle2, Circle } from 'lucide-react';

interface SubtopicRowProps {
  subtopic: Subtopic;
  isCompleted: boolean;
  onToggleComplete: (subtopicId: string, isCompleted: boolean) => void;
}

export const SubtopicRow: React.FC<SubtopicRowProps> = ({
  subtopic,
  isCompleted,
  onToggleComplete,
}) => {
  return (
    <div
      className={`py-2 px-3 rounded-lg border transition duration-150 flex items-center justify-between gap-3 text-xs ${
        isCompleted
          ? 'bg-emerald-50/70 border-emerald-200 text-stone-600'
          : 'bg-white border-stone-200 hover:border-emerald-300 hover:bg-stone-50/50 text-stone-800'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(subtopic.id, isCompleted);
          }}
          className="text-stone-400 hover:text-emerald-700 transition flex-shrink-0 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 rounded"
          title={isCompleted ? 'Mark subtopic incomplete' : 'Mark subtopic complete'}
          aria-label={isCompleted ? `Mark ${subtopic.title} incomplete` : `Mark ${subtopic.title} complete`}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          ) : (
            <Circle className="w-4 h-4 hover:text-stone-700" />
          )}
        </button>

        <span
          className={`font-medium transition truncate ${
            isCompleted ? 'line-through text-stone-400' : 'text-stone-800'
          }`}
          title={subtopic.title}
        >
          {subtopic.title}
        </span>
      </div>

      {isCompleted && (
        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded flex-shrink-0">
          Done
        </span>
      )}
    </div>
  );
};
