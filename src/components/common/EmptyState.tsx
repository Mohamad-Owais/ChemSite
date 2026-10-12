import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-stone-100 flex items-center justify-center text-stone-500 mb-3 ring-4 ring-stone-50">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-stone-900">{title}</h4>
      <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
