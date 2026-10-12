export type UserRole = 'admin' | 'student';

export type ResourceType =
  | 'lecture_video'
  | 'book'
  | 'notes'
  | 'dpp'
  | 'pyq'
  | 'test'
  | 'answer_key'
  | 'other';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  unit_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface StudySchedule {
  id: string;
  topic_id: string;
  scheduled_date: string; // YYYY-MM-DD
  notes: string | null;
  created_at: string;
  // joined fields
  topic?: Topic;
  unit?: Unit;
}

export interface TopicCompletion {
  id: string;
  topic_id: string;
  user_id: string;
  completed_at: string;
}

export interface Resource {
  id: string;
  title: string;
  resource_type: ResourceType;
  external_url: string | null;
  storage_path: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}

export interface TopicResource {
  topic_id: string;
  resource_id: string;
  created_at: string;
  resource?: Resource;
}

export interface SyllabusDocument {
  id: string;
  title: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  is_active: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  lecture_video: 'Video Lecture',
  book: 'Book / Reference',
  notes: 'Notes',
  dpp: 'DPP (Practice Problems)',
  pyq: 'Previous Year Question (PYQ)',
  test: 'Test Paper',
  answer_key: 'Answer Key',
  other: 'Other Resource',
};

export const RESOURCE_TYPE_COLORS: Record<ResourceType, { bg: string; text: string; border: string }> = {
  lecture_video: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  book: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  notes: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  dpp: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  pyq: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  test: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  answer_key: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  other: { bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-200' },
};
