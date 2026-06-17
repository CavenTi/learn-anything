/* ================================================================== */
/*  useTopicData — Data access layer                                   */
/*                                                                     */
/*  Uses Vite's import.meta.glob to resolve files at build time.        */
/*  All patterns are static string literals (required by Vite).         */
/*                                                                     */
/*  Performance: module-level indexes are built once at import time,    */
/*  providing O(1) lookup for all public API functions. Computed         */
/*  results are cached to avoid redundant object allocation.            */
/*                                                                     */
/*  Lazy loading: session & exercise content use lazy globs so file     */
/*  contents are NOT bundled eagerly. Content is loaded on-demand via   */
/*  dynamic import() when a file is selected.                           */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type ConceptStatus = 'mastered' | 'in_progress' | 'needs_practice' | 'unexplored';

export interface Concept {
  name: string;
  slug: string;
  status: ConceptStatus;
  confidence: number;
  practice_count: number;
  explain_count: number;
  last_explained: string | null;
  last_practiced: string | null;
  details: string[];
}

export interface Domain {
  name: string;
  slug: string;
  concepts: Concept[];
}

export interface StateV1 {
  version: 1;
  topic: string;
  slug: string;
  created: string;
  domains: Domain[];
}

export interface TopicSummary {
  slug: string;
  name: string;
  domainCount: number;
  totalConcepts: number;
  masteredCount: number;
  percentage: number;
}

export interface SessionFile {
  filename: string;
  path: string;
}

export interface ExerciseFile {
  name: string;
  path: string;
}

export interface ExerciseGroup {
  conceptSlug: string;
  conceptName: string;
  files: ExerciseFile[];
}

export interface SelectedFilePayload {
  path: string;
  content: string;
  type: 'markdown' | 'code';
}

/* ------------------------------------------------------------------ */
/*  Build-time glob imports                                            */
/* ------------------------------------------------------------------ */

// Eager: state.json & knowledge-map (small, always needed)
// Production reads from site/topics, tests read from test/fixtures/topics
const testStateGlob =
  import.meta.env.MODE === 'test'
    ? import.meta.glob('../../../test/fixtures/topics/*/state.json', {
        eager: true,
        import: 'default',
      })
    : {};

const stateModules = {
  ...import.meta.glob('../../topics/*/state.json', {
    eager: true,
    import: 'default',
  }),
  ...testStateGlob,
} as Record<string, StateV1>;

const testKmGlob =
  import.meta.env.MODE === 'test'
    ? import.meta.glob('../../../test/fixtures/topics/*/knowledge-map.md', {
        eager: true,
        query: '?raw',
        import: 'default',
      })
    : {};

const knowledgeMapModules = {
  ...import.meta.glob('../../topics/*/knowledge-map.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
  ...testKmGlob,
} as Record<string, string>;

// Lazy: session & exercise content loaded on demand via dynamic import()
const testSessionGlob =
  import.meta.env.MODE === 'test'
    ? import.meta.glob('../../../test/fixtures/topics/*/sessions/*/*.md', {
        query: '?raw',
      })
    : {};

const sessionContentLoaders = {
  ...import.meta.glob('../../topics/*/sessions/*/*.md', {
    query: '?raw',
  }),
  ...testSessionGlob,
} as Record<string, () => Promise<{ default: string }>>;

const testExerciseGlob =
  import.meta.env.MODE === 'test'
    ? import.meta.glob('../../../test/fixtures/topics/*/exercises/**/*', {
        query: '?raw',
      })
    : {};

const exerciseContentLoaders = {
  ...import.meta.glob('../../topics/*/exercises/**/*', {
    query: '?raw',
  }),
  ...testExerciseGlob,
} as Record<string, () => Promise<{ default: string }>>;

/* ------------------------------------------------------------------ */
/*  Path helpers                                                      */
/* ------------------------------------------------------------------ */

function slugFromStatePath(path: string): string {
  const match = path.match(/\/topics\/([^/]+)\/state\.json$/);
  return match?.[1] || '';
}

function filenameFromPath(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || '';
}

/* ------------------------------------------------------------------ */
/*  Module-level indexes (built once at import time, O(1) lookup)      */
/* ------------------------------------------------------------------ */

const stateBySlug = new Map<string, StateV1>();
const knowledgeMapBySlug = new Map<string, string>();
const sessionsBySlug = new Map<string, Map<string, SessionFile[]>>();
const exerciseGroupsBySlug = new Map<string, ExerciseGroup[]>();

let topicSummaryCache: TopicSummary[] | null = null;

(function buildIndexes() {
  /* --- States --- */
  for (const [path, state] of Object.entries(stateModules)) {
    const slug = slugFromStatePath(path);
    if (slug) stateBySlug.set(slug, state);
  }

  /* --- Knowledge maps --- */
  for (const [path, content] of Object.entries(knowledgeMapModules)) {
    const match = path.match(/\/topics\/([^/]+)\/knowledge-map\.md$/);
    if (match?.[1]) knowledgeMapBySlug.set(match[1], content);
  }

  /* --- Sessions: pre-grouped slug → domain → files (paths only, content lazy) --- */
  for (const path of Object.keys(sessionContentLoaders)) {
    if (!path.endsWith('.md')) continue;
    const match = path.match(/\/topics\/([^/]+)\/sessions\/([^/]+)\//);
    if (!match) continue;
    const [, slug, domain] = match;
    if (!sessionsBySlug.has(slug)) sessionsBySlug.set(slug, new Map());
    const domainMap = sessionsBySlug.get(slug)!;
    if (!domainMap.has(domain)) domainMap.set(domain, []);
    domainMap.get(domain)!.push({
      filename: filenameFromPath(path),
      path,
    });
  }
  for (const domainMap of sessionsBySlug.values()) {
    for (const files of domainMap.values()) {
      files.sort((a, b) => b.filename.localeCompare(a.filename));
    }
  }

  /* --- Exercises: pre-grouped slug → concept (paths only, content lazy) --- */
  const namesBySlug = new Map<string, Map<string, string>>();
  for (const [slug, state] of stateBySlug) {
    const nameMap = new Map<string, string>();
    for (const domain of state.domains) {
      for (const concept of domain.concepts) {
        nameMap.set(concept.slug, concept.name);
      }
    }
    namesBySlug.set(slug, nameMap);
  }

  const raw: Record<string, Map<string, ExerciseFile[]>> = {};
  for (const path of Object.keys(exerciseContentLoaders)) {
    const match = path.match(/\/topics\/([^/]+)\/exercises\/([^/]+)\//);
    if (!match) continue;
    const [, slug, concept] = match;
    if (!raw[slug]) raw[slug] = new Map();
    const conceptMap = raw[slug];
    if (!conceptMap.has(concept)) conceptMap.set(concept, []);
    conceptMap.get(concept)!.push({ name: filenameFromPath(path), path });
  }

  for (const [slug, conceptMap] of Object.entries(raw)) {
    const names = namesBySlug.get(slug);
    const groups: ExerciseGroup[] = [];
    for (const [conceptSlug, files] of conceptMap) {
      groups.push({
        conceptSlug,
        conceptName: names?.get(conceptSlug) || conceptSlug,
        files,
      });
    }
    groups.sort((a, b) => a.conceptName.localeCompare(b.conceptName));
    exerciseGroupsBySlug.set(slug, groups);
  }
})();

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export function listAllTopics(): TopicSummary[] {
  if (topicSummaryCache) return topicSummaryCache;

  const summaries: TopicSummary[] = [];
  for (const [slug, state] of stateBySlug) {
    const allConcepts = state.domains.flatMap((d) => d.concepts);
    const total = allConcepts.length;
    const mastered = allConcepts.filter((c) => c.status === 'mastered').length;

    summaries.push({
      slug,
      name: state.topic || slug,
      domainCount: state.domains.length,
      totalConcepts: total,
      masteredCount: mastered,
      percentage: total > 0 ? Math.round((mastered / total) * 100) : 0,
    } satisfies TopicSummary);
  }

  summaries.sort((a, b) => a.name.localeCompare(b.name));
  topicSummaryCache = summaries;
  return topicSummaryCache;
}

export function loadTopic(slug: string): StateV1 | null {
  return stateBySlug.get(slug) ?? null;
}

export function loadKnowledgeMap(slug: string): string | null {
  return knowledgeMapBySlug.get(slug) ?? null;
}

export function scanSessions(slug: string, domain: string): SessionFile[] {
  return sessionsBySlug.get(slug)?.get(domain) ?? [];
}

export function scanExercises(slug: string): ExerciseGroup[] {
  return exerciseGroupsBySlug.get(slug) ?? [];
}

export async function loadSessionContent(path: string): Promise<string | null> {
  const loader = sessionContentLoaders[path];
  if (!loader) return null;
  const mod = await loader();
  return (mod as { default: string }).default;
}

export async function loadExerciseContent(path: string): Promise<string | null> {
  const loader = exerciseContentLoaders[path];
  if (!loader) return null;
  const mod = await loader();
  return (mod as { default: string }).default;
}
