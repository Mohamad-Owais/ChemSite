import { supabase, isSupabaseConfigured, uploadFileToStorage, deleteFileFromStorage } from './supabase';
import {
  Unit,
  Topic,
  StudySchedule,
  TopicCompletion,
  Resource,
  TopicResource,
  SyllabusDocument,
  ResourceType,
} from '../types/database';

// Local storage mock keys for offline preview
const STORAGE_KEYS = {
  UNITS: 'chemsite_units',
  TOPICS: 'chemsite_topics',
  SCHEDULES: 'chemsite_schedules',
  COMPLETIONS: 'chemsite_completions',
  RESOURCES: 'chemsite_resources',
  TOPIC_RESOURCES: 'chemsite_topic_resources',
  SYLLABUS: 'chemsite_syllabus',
};

// Default seed data for offline verification (clearly labeled as starter demonstration)
const DEFAULT_UNITS: Unit[] = [
  {
    id: 'u1',
    title: 'Unit 1: Chemical Bonding and Molecular Structure',
    description: 'VSEPR, hybridization, MO theory, dipole moments, and lattice energy.',
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'u2',
    title: 'Unit 2: Chemical Thermodynamics',
    description: 'First, second, and third laws; Maxwell relations; Gibbs-Helmholtz equation.',
    order_index: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'u3',
    title: 'Unit 3: Reaction Mechanisms in Organic Chemistry',
    description: 'SN1, SN2, E1, E2, nucleophilic additions and aromatic substitutions.',
    order_index: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_TOPICS: Topic[] = [
  {
    id: 't1',
    unit_id: 'u1',
    title: 'Molecular Orbital Theory of Diatomic Molecules (O2, N2, CO, NO)',
    description: 'Bond order, magnetic properties, and Walsh diagrams.',
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't2',
    unit_id: 'u1',
    title: 'VSEPR Theory and Shapes of Hypervalent Molecules (SF4, XeF4, ClF3)',
    description: 'Lone pair repulsion and Bent rule applications.',
    order_index: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't3',
    unit_id: 'u2',
    title: 'Gibbs Energy, Chemical Potential and Phase Equilibria (Clapeyron Equation)',
    description: 'Derivation and phase diagram problem solving.',
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't4',
    unit_id: 'u3',
    title: 'Stereochemistry & Kinetic vs Thermodynamic Control in Addition Reactions',
    description: 'Addition to conjugated dienes, regioselectivity rules.',
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const todayStr = new Date().toISOString().split('T')[0];
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];

const DEFAULT_SCHEDULES: StudySchedule[] = [
  {
    id: 's1',
    topic_id: 't1',
    scheduled_date: todayStr,
    notes: 'Focus on drawing MO energy level diagrams and comparing bond dissociation energies.',
    created_at: new Date().toISOString(),
  },
  {
    id: 's2',
    topic_id: 't3',
    scheduled_date: tomorrowStr,
    notes: 'Solve numerical problems on Clausius-Clapeyron equation and enthalpy of vaporization.',
    created_at: new Date().toISOString(),
  },
  {
    id: 's3',
    topic_id: 't2',
    scheduled_date: yesterdayStr,
    notes: 'Quick review of Lewis dot structures before applying VSEPR.',
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_RESOURCES: Resource[] = [
  {
    id: 'r1',
    title: 'NPTEL Lecture 04: MO Diagrams for Heteronuclear Diatomics',
    resource_type: 'lecture_video',
    external_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    storage_path: null,
    file_name: null,
    file_size: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'r2',
    title: 'Inorganic Chemistry (Miessler & Tarr) — Chapter 5 Excerpt',
    resource_type: 'book',
    external_url: null,
    storage_path: 'resources/sample_mo_theory.pdf',
    file_name: 'Miessler_Tarr_Chapter_5.pdf',
    file_size: 4200000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'r3',
    title: 'Daily Practice Problem (DPP #01) — Chemical Bonding',
    resource_type: 'dpp',
    external_url: null,
    storage_path: 'resources/dpp_01_bonding.pdf',
    file_name: 'DPP_01_Bonding.pdf',
    file_size: 1540000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'r4',
    title: 'IIT-JAM 2021-2024 Bonding PYQ Compilation with Solutions',
    resource_type: 'pyq',
    external_url: null,
    storage_path: 'resources/pyq_bonding_2024.pdf',
    file_name: 'Bonding_PYQ_Solved.pdf',
    file_size: 2890000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_TOPIC_RESOURCES: TopicResource[] = [
  { topic_id: 't1', resource_id: 'r1', created_at: new Date().toISOString() },
  { topic_id: 't1', resource_id: 'r2', created_at: new Date().toISOString() },
  { topic_id: 't1', resource_id: 'r3', created_at: new Date().toISOString() },
  { topic_id: 't1', resource_id: 'r4', created_at: new Date().toISOString() },
  { topic_id: 't2', resource_id: 'r3', created_at: new Date().toISOString() },
];

function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// --------------------------------------------------------------------------
// Units & Topics API
// --------------------------------------------------------------------------

export async function fetchUnits(): Promise<Unit[]> {
  if (!isSupabaseConfigured) {
    return getLocal<Unit[]>(STORAGE_KEYS.UNITS, DEFAULT_UNITS).sort((a, b) => a.order_index - b.order_index);
  }

  const { data, error } = await supabase
    .from('units')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Failed to fetch units:', error);
    throw error;
  }
  return data || [];
}

export async function fetchTopics(unitId?: string): Promise<Topic[]> {
  if (!isSupabaseConfigured) {
    const all = getLocal<Topic[]>(STORAGE_KEYS.TOPICS, DEFAULT_TOPICS);
    const filtered = unitId ? all.filter((t) => t.unit_id === unitId) : all;
    return filtered.sort((a, b) => a.order_index - b.order_index);
  }

  let query = supabase.from('topics').select('*').order('order_index', { ascending: true });
  if (unitId) {
    query = query.eq('unit_id', unitId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Failed to fetch topics:', error);
    throw error;
  }
  return data || [];
}

export async function createUnit(title: string, description?: string): Promise<Unit> {
  if (!isSupabaseConfigured) {
    const units = getLocal<Unit[]>(STORAGE_KEYS.UNITS, DEFAULT_UNITS);
    const newUnit: Unit = {
      id: 'unit_' + Date.now(),
      title,
      description: description || null,
      order_index: units.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    units.push(newUnit);
    setLocal(STORAGE_KEYS.UNITS, units);
    return newUnit;
  }

  // Get max order_index
  const { data: existing } = await supabase.from('units').select('order_index').order('order_index', { ascending: false }).limit(1);
  const nextOrder = (existing?.[0]?.order_index ?? 0) + 1;

  const { data, error } = await supabase
    .from('units')
    .insert([{ title, description: description || null, order_index: nextOrder }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUnit(id: string, updates: Partial<Pick<Unit, 'title' | 'description' | 'order_index'>>): Promise<Unit> {
  if (!isSupabaseConfigured) {
    const units = getLocal<Unit[]>(STORAGE_KEYS.UNITS, DEFAULT_UNITS);
    const idx = units.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Unit not found');
    units[idx] = { ...units[idx], ...updates, updated_at: new Date().toISOString() };
    setLocal(STORAGE_KEYS.UNITS, units);
    return units[idx];
  }

  const { data, error } = await supabase
    .from('units')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUnit(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const units = getLocal<Unit[]>(STORAGE_KEYS.UNITS, DEFAULT_UNITS).filter((u) => u.id !== id);
    setLocal(STORAGE_KEYS.UNITS, units);
    // Delete cascading topics
    const topics = getLocal<Topic[]>(STORAGE_KEYS.TOPICS, DEFAULT_TOPICS).filter((t) => t.unit_id !== id);
    setLocal(STORAGE_KEYS.TOPICS, topics);
    return;
  }

  const { error } = await supabase.from('units').delete().eq('id', id);
  if (error) throw error;
}

export async function createTopic(unitId: string, title: string, description?: string): Promise<Topic> {
  if (!isSupabaseConfigured) {
    const topics = getLocal<Topic[]>(STORAGE_KEYS.TOPICS, DEFAULT_TOPICS);
    const unitTopics = topics.filter((t) => t.unit_id === unitId);
    const newTopic: Topic = {
      id: 'topic_' + Date.now(),
      unit_id: unitId,
      title,
      description: description || null,
      order_index: unitTopics.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    topics.push(newTopic);
    setLocal(STORAGE_KEYS.TOPICS, topics);
    return newTopic;
  }

  const { data: existing } = await supabase
    .from('topics')
    .select('order_index')
    .eq('unit_id', unitId)
    .order('order_index', { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.order_index ?? 0) + 1;

  const { data, error } = await supabase
    .from('topics')
    .insert([{ unit_id: unitId, title, description: description || null, order_index: nextOrder }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTopic(id: string, updates: Partial<Pick<Topic, 'title' | 'description' | 'order_index' | 'unit_id'>>): Promise<Topic> {
  if (!isSupabaseConfigured) {
    const topics = getLocal<Topic[]>(STORAGE_KEYS.TOPICS, DEFAULT_TOPICS);
    const idx = topics.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Topic not found');
    topics[idx] = { ...topics[idx], ...updates, updated_at: new Date().toISOString() };
    setLocal(STORAGE_KEYS.TOPICS, topics);
    return topics[idx];
  }

  const { data, error } = await supabase
    .from('topics')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTopic(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const topics = getLocal<Topic[]>(STORAGE_KEYS.TOPICS, DEFAULT_TOPICS).filter((t) => t.id !== id);
    setLocal(STORAGE_KEYS.TOPICS, topics);
    // Delete topic_resources junction only, preserving shared resources
    const tr = getLocal<TopicResource[]>(STORAGE_KEYS.TOPIC_RESOURCES, DEFAULT_TOPIC_RESOURCES).filter(
      (r) => r.topic_id !== id
    );
    setLocal(STORAGE_KEYS.TOPIC_RESOURCES, tr);
    return;
  }

  const { error } = await supabase.from('topics').delete().eq('id', id);
  if (error) throw error;
}

// --------------------------------------------------------------------------
// Study Schedules API
// --------------------------------------------------------------------------

export async function fetchSchedules(): Promise<StudySchedule[]> {
  if (!isSupabaseConfigured) {
    const schedules = getLocal<StudySchedule[]>(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULES);
    const topics = getLocal<Topic[]>(STORAGE_KEYS.TOPICS, DEFAULT_TOPICS);
    const units = getLocal<Unit[]>(STORAGE_KEYS.UNITS, DEFAULT_UNITS);

    return schedules
      .map((s) => {
        const t = topics.find((top) => top.id === s.topic_id);
        const u = t ? units.find((un) => un.id === t.unit_id) : undefined;
        return { ...s, topic: t, unit: u };
      })
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
  }

  const { data, error } = await supabase
    .from('study_schedules')
    .select(`
      *,
      topic:topics (
        *,
        unit:units (*)
      )
    `)
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Failed to fetch study schedules:', error);
    throw error;
  }
  return data || [];
}

export async function createSchedule(topicId: string, scheduledDate: string, notes?: string): Promise<StudySchedule> {
  if (!isSupabaseConfigured) {
    const schedules = getLocal<StudySchedule[]>(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULES);
    const newEntry: StudySchedule = {
      id: 'sched_' + Date.now(),
      topic_id: topicId,
      scheduled_date: scheduledDate,
      notes: notes || null,
      created_at: new Date().toISOString(),
    };
    schedules.push(newEntry);
    setLocal(STORAGE_KEYS.SCHEDULES, schedules);
    return newEntry;
  }

  const { data, error } = await supabase
    .from('study_schedules')
    .insert([{ topic_id: topicId, scheduled_date: scheduledDate, notes: notes || null }])
    .select(`
      *,
      topic:topics (
        *,
        unit:units (*)
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateSchedule(id: string, scheduledDate: string, notes?: string): Promise<StudySchedule> {
  if (!isSupabaseConfigured) {
    const schedules = getLocal<StudySchedule[]>(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULES);
    const idx = schedules.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Schedule not found');
    schedules[idx] = { ...schedules[idx], scheduled_date: scheduledDate, notes: notes || null };
    setLocal(STORAGE_KEYS.SCHEDULES, schedules);
    return schedules[idx];
  }

  const { data, error } = await supabase
    .from('study_schedules')
    .update({ scheduled_date: scheduledDate, notes: notes || null })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSchedule(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const schedules = getLocal<StudySchedule[]>(STORAGE_KEYS.SCHEDULES, DEFAULT_SCHEDULES).filter((s) => s.id !== id);
    setLocal(STORAGE_KEYS.SCHEDULES, schedules);
    return;
  }

  const { error } = await supabase.from('study_schedules').delete().eq('id', id);
  if (error) throw error;
}

// --------------------------------------------------------------------------
// Topic Completion API (Manual Student Marking)
// --------------------------------------------------------------------------

export async function fetchTopicCompletions(userId: string): Promise<TopicCompletion[]> {
  if (!isSupabaseConfigured) {
    const completions = getLocal<TopicCompletion[]>(STORAGE_KEYS.COMPLETIONS, []);
    return completions.filter((c) => c.user_id === userId);
  }

  const { data, error } = await supabase
    .from('topic_completions')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to fetch completions:', error);
    throw error;
  }
  return data || [];
}

export async function fetchAllCompletions(): Promise<TopicCompletion[]> {
  if (!isSupabaseConfigured) {
    return getLocal<TopicCompletion[]>(STORAGE_KEYS.COMPLETIONS, []);
  }

  const { data, error } = await supabase.from('topic_completions').select('*');
  if (error) throw error;
  return data || [];
}

export async function toggleTopicCompletion(topicId: string, userId: string, isCurrentlyComplete: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) {
    let completions = getLocal<TopicCompletion[]>(STORAGE_KEYS.COMPLETIONS, []);
    if (isCurrentlyComplete) {
      completions = completions.filter((c) => !(c.topic_id === topicId && c.user_id === userId));
    } else {
      completions.push({
        id: 'comp_' + Date.now(),
        topic_id: topicId,
        user_id: userId,
        completed_at: new Date().toISOString(),
      });
    }
    setLocal(STORAGE_KEYS.COMPLETIONS, completions);
    return !isCurrentlyComplete;
  }

  if (isCurrentlyComplete) {
    // Undo completion
    const { error } = await supabase
      .from('topic_completions')
      .delete()
      .eq('topic_id', topicId)
      .eq('user_id', userId);

    if (error) throw error;
    return false;
  } else {
    // Mark complete
    const { error } = await supabase
      .from('topic_completions')
      .insert([{ topic_id: topicId, user_id: userId }]);

    if (error) throw error;
    return true;
  }
}

// --------------------------------------------------------------------------
// Resources & Topic Mappings API
// --------------------------------------------------------------------------

export async function fetchResources(): Promise<Resource[]> {
  if (!isSupabaseConfigured) {
    return getLocal<Resource[]>(STORAGE_KEYS.RESOURCES, DEFAULT_RESOURCES);
  }

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchTopicResources(topicId?: string): Promise<TopicResource[]> {
  if (!isSupabaseConfigured) {
    const mappings = getLocal<TopicResource[]>(STORAGE_KEYS.TOPIC_RESOURCES, DEFAULT_TOPIC_RESOURCES);
    const resources = getLocal<Resource[]>(STORAGE_KEYS.RESOURCES, DEFAULT_RESOURCES);

    const filtered = topicId ? mappings.filter((m) => m.topic_id === topicId) : mappings;
    return filtered.map((m) => ({
      ...m,
      resource: resources.find((r) => r.id === m.resource_id),
    }));
  }

  let query = supabase.from('topic_resources').select(`
    *,
    resource:resources (*)
  `);

  if (topicId) {
    query = query.eq('topic_id', topicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createResource(data: {
  title: string;
  resource_type: ResourceType;
  external_url?: string | null;
  storage_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  topic_ids?: string[];
}): Promise<Resource> {
  const { topic_ids, ...resourceData } = data;

  if (!isSupabaseConfigured) {
    const resources = getLocal<Resource[]>(STORAGE_KEYS.RESOURCES, DEFAULT_RESOURCES);
    const newResource: Resource = {
      id: 'res_' + Date.now(),
      title: resourceData.title,
      resource_type: resourceData.resource_type,
      external_url: resourceData.external_url || null,
      storage_path: resourceData.storage_path || null,
      file_name: resourceData.file_name || null,
      file_size: resourceData.file_size || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    resources.unshift(newResource);
    setLocal(STORAGE_KEYS.RESOURCES, resources);

    if (topic_ids && topic_ids.length > 0) {
      const mappings = getLocal<TopicResource[]>(STORAGE_KEYS.TOPIC_RESOURCES, DEFAULT_TOPIC_RESOURCES);
      topic_ids.forEach((tId) => {
        mappings.push({
          topic_id: tId,
          resource_id: newResource.id,
          created_at: new Date().toISOString(),
        });
      });
      setLocal(STORAGE_KEYS.TOPIC_RESOURCES, mappings);
    }

    return newResource;
  }

  // Live Supabase
  const { data: created, error } = await supabase
    .from('resources')
    .insert([resourceData])
    .select()
    .single();

  if (error) throw error;

  if (topic_ids && topic_ids.length > 0) {
    const rows = topic_ids.map((topic_id) => ({
      topic_id,
      resource_id: created.id,
    }));
    const { error: mapError } = await supabase.from('topic_resources').insert(rows);
    if (mapError) {
      console.error('Failed to link topic resources:', mapError);
    }
  }

  return created;
}

export async function updateResource(
  id: string,
  data: Partial<Pick<Resource, 'title' | 'resource_type' | 'external_url' | 'storage_path' | 'file_name' | 'file_size'>>,
  topic_ids?: string[]
): Promise<Resource> {
  if (!isSupabaseConfigured) {
    const resources = getLocal<Resource[]>(STORAGE_KEYS.RESOURCES, DEFAULT_RESOURCES);
    const idx = resources.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Resource not found');

    resources[idx] = { ...resources[idx], ...data, updated_at: new Date().toISOString() };
    setLocal(STORAGE_KEYS.RESOURCES, resources);

    if (topic_ids !== undefined) {
      let mappings = getLocal<TopicResource[]>(STORAGE_KEYS.TOPIC_RESOURCES, DEFAULT_TOPIC_RESOURCES);
      mappings = mappings.filter((m) => m.resource_id !== id);
      topic_ids.forEach((tId) => {
        mappings.push({ topic_id: tId, resource_id: id, created_at: new Date().toISOString() });
      });
      setLocal(STORAGE_KEYS.TOPIC_RESOURCES, mappings);
    }

    return resources[idx];
  }

  const { data: updated, error } = await supabase
    .from('resources')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (topic_ids !== undefined) {
    // Delete existing mappings
    await supabase.from('topic_resources').delete().eq('resource_id', id);

    if (topic_ids.length > 0) {
      const rows = topic_ids.map((topic_id) => ({
        topic_id,
        resource_id: id,
      }));
      await supabase.from('topic_resources').insert(rows);
    }
  }

  return updated;
}

export async function deleteResource(id: string, storagePath?: string | null): Promise<void> {
  if (storagePath) {
    await deleteFileFromStorage(storagePath);
  }

  if (!isSupabaseConfigured) {
    const resources = getLocal<Resource[]>(STORAGE_KEYS.RESOURCES, DEFAULT_RESOURCES).filter((r) => r.id !== id);
    setLocal(STORAGE_KEYS.RESOURCES, resources);

    const mappings = getLocal<TopicResource[]>(STORAGE_KEYS.TOPIC_RESOURCES, DEFAULT_TOPIC_RESOURCES).filter(
      (m) => m.resource_id !== id
    );
    setLocal(STORAGE_KEYS.TOPIC_RESOURCES, mappings);
    return;
  }

  const { error } = await supabase.from('resources').delete().eq('id', id);
  if (error) throw error;
}

// --------------------------------------------------------------------------
// Syllabus API
// --------------------------------------------------------------------------

export async function fetchActiveSyllabus(): Promise<SyllabusDocument | null> {
  if (!isSupabaseConfigured) {
    return getLocal<SyllabusDocument | null>(STORAGE_KEYS.SYLLABUS, {
      id: 'syl_default',
      title: 'IIT-JAM Chemistry Official Syllabus',
      storage_path: 'syllabus/iitjam_chemistry_syllabus.pdf',
      file_name: 'IIT_JAM_Chemistry_Syllabus.pdf',
      file_size: 1845000,
      is_active: true,
      uploaded_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const { data, error } = await supabase
    .from('syllabus_documents')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch syllabus:', error);
    return null;
  }
  return data;
}

export async function uploadSyllabus(file: File, title = 'IIT-JAM Chemistry Syllabus'): Promise<SyllabusDocument> {
  const uploadResult = await uploadFileToStorage(file, 'syllabus');
  if (!uploadResult) throw new Error('File upload failed');

  if (!isSupabaseConfigured) {
    const doc: SyllabusDocument = {
      id: 'syl_' + Date.now(),
      title,
      storage_path: uploadResult.storagePath,
      file_name: uploadResult.fileName,
      file_size: uploadResult.fileSize,
      is_active: true,
      uploaded_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLocal(STORAGE_KEYS.SYLLABUS, doc);
    return doc;
  }

  // Mark all previous syllabi inactive
  await supabase.from('syllabus_documents').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');

  const { data, error } = await supabase
    .from('syllabus_documents')
    .insert([
      {
        title,
        storage_path: uploadResult.storagePath,
        file_name: uploadResult.fileName,
        file_size: uploadResult.fileSize,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
