import React, { useState } from 'react';
import {
  Unit,
  Topic,
  StudySchedule,
  Resource,
  SyllabusDocument,
  TopicCompletion,
} from '../../types/database';
import { UnitManager } from './UnitManager';
import { TopicManager } from './TopicManager';
import { ScheduleManager } from './ScheduleManager';
import { ResourceManager } from './ResourceManager';
import { StudentProgressView } from './StudentProgressView';
import { SyllabusViewer } from '../syllabus/SyllabusViewer';
import { Layers, Calendar, BookOpen, BarChart3, ShieldCheck } from 'lucide-react';

interface AdminDashboardProps {
  units: Unit[];
  topics: Topic[];
  schedules: StudySchedule[];
  resources: Resource[];
  syllabus: SyllabusDocument | null;
  completions: TopicCompletion[];
  onDataChanged: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  units,
  topics,
  schedules,
  resources,
  syllabus,
  completions,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'planner' | 'resources' | 'progress'>(
    'curriculum'
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-900 rounded-3xl p-6 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h1 className="text-xl font-bold tracking-tight">Admin Management Panel</h1>
            </div>
            <p className="text-xs text-stone-400">
              Manage syllabus units, topic breakdowns, daily schedule dates, external lectures, and PDFs.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-stone-300 bg-stone-800/80 px-3 py-1.5 rounded-xl border border-stone-700">
            <span>{units.length} Units</span>
            <span className="text-stone-500">•</span>
            <span>{topics.length} Topics</span>
            <span className="text-stone-500">•</span>
            <span>{resources.length} Resources</span>
          </div>
        </div>
      </div>

      {/* Syllabus Document Section */}
      <SyllabusViewer syllabus={syllabus} onSyllabusUpdated={onDataChanged} />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('curriculum')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
            activeTab === 'curriculum'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Units & Topics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('planner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
            activeTab === 'planner'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Planner</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
            activeTab === 'resources'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Resource Library</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('progress')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
            activeTab === 'progress'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Student Progress</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'curriculum' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <UnitManager units={units} onUnitsChanged={onDataChanged} />
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <TopicManager units={units} topics={topics} onTopicsChanged={onDataChanged} />
          </div>
        </div>
      )}

      {activeTab === 'planner' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
          <ScheduleManager
            units={units}
            topics={topics}
            schedules={schedules}
            onSchedulesChanged={onDataChanged}
          />
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
          <ResourceManager
            resources={resources}
            topics={topics}
            units={units}
            onResourcesChanged={onDataChanged}
          />
        </div>
      )}

      {activeTab === 'progress' && (
        <StudentProgressView units={units} topics={topics} completions={completions} />
      )}
    </div>
  );
};
