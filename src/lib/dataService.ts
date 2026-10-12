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
    title: 'Section 1: Basic Mathematical Concepts (10+2 Level)',
    description: 'Functions, calculus, differential equations, vectors, matrices, determinants, and elementary statistics.',
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'u2',
    title: 'Section 2: Physical Chemistry',
    description: 'Atomic structure, states of matter, thermodynamics, equilibria, electrochemistry, kinetics, and spectroscopy.',
    order_index: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'u3',
    title: 'Section 3: Organic Chemistry',
    description: 'Structure, stereochemistry, reaction mechanisms, synthetic applications, spectroscopy, and natural products.',
    order_index: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'u4',
    title: 'Section 4: Inorganic Chemistry',
    description: 'Periodicity, bonding, s/p/d block elements, coordination chemistry, bioinorganic, and analytical methods.',
    order_index: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_TOPICS: Topic[] = [
  // Section 1
  {
    id: 't_m1',
    unit_id: 'u1',
    title: '1.1: Basic Mathematical Concepts',
    description: 'Functions; maxima and minima; integrals; ordinary differential equations; vectors and matrices; determinants; elementary statistics.',
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Section 2: Physical
  {
    id: 't_p1',
    unit_id: 'u2',
    title: '2.1: Atomic and Molecular Structure',
    description: 'Planck’s black body radiation, Photoelectric effect, Bohr’s theory, de Broglie, Heisenberg, Schrödinger equation, wave functions, particle in a box, hydrogen atom orbitals.',
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_p2',
    unit_id: 'u2',
    title: '2.2: Gaseous State',
    description: 'Kinetic molecular model, Maxwell-Boltzmann distribution, law of equipartition, van der Waals equation of state, critical state.',
    order_index: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_p3',
    unit_id: 'u2',
    title: '2.3: Liquid State',
    description: 'Physical properties of Liquid, vapour pressure, surface tension, viscosity, effect of solute concentration and temperature.',
    order_index: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_p4',
    unit_id: 'u2',
    title: '2.4: Solid State',
    description: 'Unit cells, Miller indices, Bravais lattices, X-ray diffraction, Bragg’s law, NaCl, CsCl, diamond, graphite, defects, lattice energy.',
    order_index: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_p5',
    unit_id: 'u2',
    title: '2.5: Chemical Thermodynamics',
    description: 'Exact/in-exact differentials, Euler’s reciprocity, Laws of thermodynamics, thermochemistry, enthalpy, entropy, Gibbs free energy, chemical potential.',
    order_index: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_p6',
    unit_id: 'u2',
    title: '2.6: Chemical and Phase Equilibria',
    description: 'Law of mass action, Kp/Kc, Le-Chatelier principle, ionic equilibria, pH, buffer solutions, solubility product, Raoult’s law, phase rule, phase diagrams.',
    order_index: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_p7',
    unit_id: 'u2',
    title: '2.7: Electrochemistry',
    description: 'Conductivity, Kohlrausch law, Debye-Hückel-Onsager, Faraday’s laws, Nernst equation, standard potentials, EMF measurements, potentiometric titrations.',
    order_index: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_p8',
    unit_id: 'u2',
    title: '2.8: Chemical Kinetics',
    description: 'Order and molecularity, steady state approximation, chain reactions, Lindemann mechanism, Arrhenius equation, catalyst mechanisms, Michaelis-Menten.',
    order_index: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_p9',
    unit_id: 'u2',
    title: '2.9: Adsorption',
    description: 'Gibbs adsorption equation, adsorption isotherms, surface area of adsorbents, surface films on liquids.',
    order_index: 9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_p10',
    unit_id: 'u2',
    title: '2.10: Spectroscopy',
    description: 'Beer-Lambert’s law; fundamental concepts of rotational, vibrational, electronic and magnetic resonance spectroscopy.',
    order_index: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Section 3: Organic
  {
    id: 't_o1',
    unit_id: 'u3',
    title: '3.1: Basic Concepts in Organic Chemistry and Stereochemistry',
    description: 'Electronic effects, steric effects, optical isomerism without stereocenters (allenes, biphenyls), conformations of acyclic/cyclic systems and decalins.',
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_o2',
    unit_id: 'u3',
    title: '3.2: Organic Reaction Mechanism and Synthetic Applications',
    description: 'Reactive intermediates, substitution/elimination, named rearrangements, named condensation reactions, oxidation-reduction, organometallics, pericyclic reactions.',
    order_index: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_o3',
    unit_id: 'u3',
    title: '3.3: Qualitative Organic Analysis',
    description: 'Functional group chemical identification, elementary UV, IR, and 1H NMR spectroscopic tools.',
    order_index: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_o4',
    unit_id: 'u3',
    title: '3.4: Natural Products Chemistry',
    description: 'Chemistry of alkaloids, steroids, terpenes, carbohydrates, amino acids, peptides and nucleic acids.',
    order_index: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_o5',
    unit_id: 'u3',
    title: '3.5: Aromatic and Heterocyclic Chemistry',
    description: 'Monocyclic, bicyclic, tricyclic aromatics, heterocycles with one hetero atom, synthesis, reactivity, aromaticity, substitution reactions.',
    order_index: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Section 4: Inorganic
  {
    id: 't_i1',
    unit_id: 'u4',
    title: '4.1: Periodic Table',
    description: 'Periodic trends, effective nuclear charge, atomic radii, ionization enthalpy, electron gain enthalpy, electronegativity.',
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_i2',
    unit_id: 'u4',
    title: '4.2: Extractions of Metals',
    description: 'General isolation and purification principles, Ellingham diagram applications.',
    order_index: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_i3',
    unit_id: 'u4',
    title: '4.3: Chemical Bonding and Shapes of Molecules',
    description: 'Ionic packing, Born-Haber, Fajan’s rules; Lewis, VBT, MOT diatomic/polyatomic, intermolecular forces, VSEPR theory.',
    order_index: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_i4',
    unit_id: 'u4',
    title: '4.4: Main Group Elements (s and p blocks)',
    description: 'Alkali/alkaline earth reactions, liquid ammonia, inert pair effect, hydrides, allotropes, oxoacids, halides, borazine, silicones, xenon fluorides.',
    order_index: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_i5',
    unit_id: 'u4',
    title: '4.5: Transition Metals (d block)',
    description: 'Coordination complexes, CFT/VBT/MOT color and magnetism, organometallics (carbonyls, nitrosyls, metallocenes), Wilkinson catalyst.',
    order_index: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_i6',
    unit_id: 'u4',
    title: '4.6: Bioinorganic Chemistry',
    description: 'Essential/trace elements, Fe2+ and Zn2+ roles, myoglobin, hemoglobin, carbonic anhydrase.',
    order_index: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_i7',
    unit_id: 'u4',
    title: '4.7: Instrumental Methods of Analysis',
    description: 'Conductometry, potentiometry, UV-vis spectrophotometry, water/air/soil analyses.',
    order_index: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't_i8',
    unit_id: 'u4',
    title: '4.8: Analytical Chemistry',
    description: 'Titrations (acid-base, redox, complexometric EDTA), precipitation, indicators, radioactivity, error analysis and statistics.',
    order_index: 8,
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
    topic_id: 't_i3',
    scheduled_date: todayStr,
    notes: 'Focus on drawing MO energy level diagrams, VSEPR shapes, and comparing bond orders.',
    created_at: new Date().toISOString(),
  },
  {
    id: 's2',
    topic_id: 't_p5',
    scheduled_date: tomorrowStr,
    notes: 'Solve numerical problems on Gibbs-Helmholtz, partial molar quantities, and chemical potential.',
    created_at: new Date().toISOString(),
  },
  {
    id: 's3',
    topic_id: 't_p1',
    scheduled_date: yesterdayStr,
    notes: 'Review Planck radiation, photoelectric effect, and particle in a 1D box wave functions.',
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
  { topic_id: 't_i3', resource_id: 'r1', created_at: new Date().toISOString() },
  { topic_id: 't_i3', resource_id: 'r2', created_at: new Date().toISOString() },
  { topic_id: 't_i3', resource_id: 'r3', created_at: new Date().toISOString() },
  { topic_id: 't_i3', resource_id: 'r4', created_at: new Date().toISOString() },
  { topic_id: 't_p1', resource_id: 'r3', created_at: new Date().toISOString() },
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
