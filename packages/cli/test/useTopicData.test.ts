import { describe, it, expect } from 'vitest';
import {
  listAllTopics,
  loadTopic,
  loadKnowledgeMap,
  scanSessions,
  scanExercises,
  loadSessionContent,
  loadExerciseContent,
} from '../site/src/composables/useTopicData';
import type { SessionFile, ExerciseGroup } from '../site/src/composables/useTopicData';

/* ==================================================================== */
/*  Fixture-based tests against packages/cli/site/topics/javascript/     */
/*  The fixture has:                                                     */
/*    - state.json with 6 domains, 24 concepts (all 'unexplored')       */
/*    - knowledge-map.md                                                 */
/*    - sessions/language-basics/2026-06-13.md                          */
/*    - sessions/language-basics/2026-06-14.md                          */
/*    - sessions/functions-scope/2026-06-14.md                           */
/*    - exercises/variables-data-types/{README,starter,solution}.{md,js} */
/*    - exercises/variables-data-types/practice-2026-06-14.json          */
/* ==================================================================== */

const VALID_SLUG = 'javascript';
const NONEXISTENT_SLUG = 'zzz-nonexistent';

/* ------------------------------------------------------------------ */
/*  listAllTopics                                                     */
/* ------------------------------------------------------------------ */

describe('listAllTopics', () => {
  it('returns the JavaScript topic from fixture data', () => {
    const topics = listAllTopics();
    expect(topics.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts correct slug and name', () => {
    const topics = listAllTopics();
    expect(topics[0].slug).toBe(VALID_SLUG);
    expect(topics[0].name).toBe('JavaScript');
  });

  it('computes correct domain and concept counts', () => {
    const topics = listAllTopics();
    expect(topics[0].domainCount).toBe(6);
    expect(topics[0].totalConcepts).toBe(24);
  });

  it('reports zero mastered when all concepts are unexplored', () => {
    const topics = listAllTopics();
    expect(topics[0].masteredCount).toBe(0);
    expect(topics[0].percentage).toBe(0);
  });

  it('sorts results by name alphabetically', () => {
    const topics = listAllTopics();
    for (let i = 1; i < topics.length; i++) {
      expect(topics[i].name.localeCompare(topics[i - 1].name)).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns an array (not null) even if no topics match', () => {
    expect(Array.isArray(listAllTopics())).toBe(true);
  });

  it('returns TopicSummary objects with expected shape', () => {
    const topics = listAllTopics();
    for (const t of topics) {
      expect(t).toHaveProperty('slug');
      expect(t).toHaveProperty('name');
      expect(t).toHaveProperty('domainCount');
      expect(t).toHaveProperty('totalConcepts');
      expect(t).toHaveProperty('masteredCount');
      expect(t).toHaveProperty('percentage');
      expect(typeof t.slug).toBe('string');
      expect(typeof t.name).toBe('string');
      expect(typeof t.domainCount).toBe('number');
      expect(typeof t.totalConcepts).toBe('number');
      expect(typeof t.masteredCount).toBe('number');
      expect(typeof t.percentage).toBe('number');
    }
  });
});

/* ------------------------------------------------------------------ */
/*  loadTopic                                                         */
/* ------------------------------------------------------------------ */

describe('loadTopic', () => {
  it('loads the full state for a valid slug', () => {
    const state = loadTopic(VALID_SLUG);
    expect(state).not.toBeNull();
    expect(state!.version).toBe(1);
    expect(state!.topic).toBe('JavaScript');
    expect(state!.slug).toBe(VALID_SLUG);
    expect(state!.created).toBe('2026-06-11');
  });

  it('returns all 6 domains', () => {
    const state = loadTopic(VALID_SLUG)!;
    expect(state.domains).toHaveLength(6);
  });

  it('domain objects have name, slug, and concepts', () => {
    const state = loadTopic(VALID_SLUG)!;
    for (const domain of state.domains) {
      expect(domain).toHaveProperty('name');
      expect(domain).toHaveProperty('slug');
      expect(domain).toHaveProperty('concepts');
      expect(typeof domain.name).toBe('string');
      expect(typeof domain.slug).toBe('string');
      expect(Array.isArray(domain.concepts)).toBe(true);
      expect(domain.concepts.length).toBeGreaterThan(0);
    }
  });

  it('concepts have expected shape', () => {
    const state = loadTopic(VALID_SLUG)!;
    for (const domain of state.domains) {
      for (const concept of domain.concepts) {
        expect(concept).toHaveProperty('name');
        expect(concept).toHaveProperty('slug');
        expect(concept).toHaveProperty('status');
        expect(concept).toHaveProperty('confidence');
        expect(concept).toHaveProperty('practice_count');
        expect(concept).toHaveProperty('explain_count');
        expect(concept).toHaveProperty('last_explained');
        expect(concept).toHaveProperty('last_practiced');
        expect(concept).toHaveProperty('details');
      }
    }
  });

  it('returns null for a non-existent slug', () => {
    expect(loadTopic(NONEXISTENT_SLUG)).toBeNull();
  });

  it('returns null for an empty string slug', () => {
    expect(loadTopic('')).toBeNull();
  });

  it('includes expected domain names in order', () => {
    const state = loadTopic(VALID_SLUG)!;
    const names = state.domains.map((d) => d.name);
    expect(names).toContain('语言基础');
    expect(names).toContain('函数与作用域');
    expect(names).toContain('对象与原型');
    expect(names).toContain('异步编程');
    expect(names).toContain('内置对象与集合');
    expect(names).toContain('模块与工程化');
  });
});

/* ------------------------------------------------------------------ */
/*  loadKnowledgeMap                                                  */
/* ------------------------------------------------------------------ */

describe('loadKnowledgeMap', () => {
  it('loads raw markdown content for a valid slug', () => {
    const md = loadKnowledgeMap(VALID_SLUG);
    expect(md).not.toBeNull();
    expect(typeof md).toBe('string');
    expect(md!.length).toBeGreaterThan(0);
  });

  it('returns null for a non-existent slug', () => {
    expect(loadKnowledgeMap(NONEXISTENT_SLUG)).toBeNull();
  });

  it('returns null for empty slug', () => {
    expect(loadKnowledgeMap('')).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  scanSessions                                                      */
/* ------------------------------------------------------------------ */

describe('scanSessions', () => {
  const slug = VALID_SLUG;

  describe('language-basics domain (2 session files)', () => {
    let sessions: SessionFile[];

    beforeAll(() => {
      sessions = scanSessions(slug, 'language-basics');
    });

    it('returns 2 session files', () => {
      expect(sessions).toHaveLength(2);
    });

    it('returns SessionFile objects with filename and path (content loaded lazily)', () => {
      for (const s of sessions) {
        expect(s).toHaveProperty('filename');
        expect(s).toHaveProperty('path');
        expect(typeof s.filename).toBe('string');
        expect(typeof s.path).toBe('string');
      }
    });

    it('sorts by filename descending (newest first)', () => {
      expect(sessions[0].filename).toBe('2026-06-14.md');
      expect(sessions[1].filename).toBe('2026-06-13.md');
    });

    it('filenames are just the file name, not full paths', () => {
      for (const s of sessions) {
        expect(s.filename).not.toContain('/');
        expect(s.filename).toMatch(/^\d{4}-\d{2}-\d{2}\.md$/);
      }
    });

    it('paths contain the correct topic and domain', () => {
      for (const s of sessions) {
        expect(s.path).toContain(`/topics/${slug}/sessions/language-basics/`);
      }
    });
  });

  describe('functions-scope domain (1 session file)', () => {
    it('returns 1 session file', () => {
      const sessions = scanSessions(slug, 'functions-scope');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].filename).toBe('2026-06-14.md');
    });
  });

  describe('edge cases', () => {
    it('returns empty array for domain with no session files', () => {
      const sessions = scanSessions(slug, 'async-programming');
      expect(sessions).toHaveLength(0);
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('returns empty array for non-existent domain', () => {
      const sessions = scanSessions(slug, 'zzz-no-domain');
      expect(sessions).toHaveLength(0);
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('returns empty array for non-existent topic', () => {
      const sessions = scanSessions(NONEXISTENT_SLUG, 'language-basics');
      expect(sessions).toHaveLength(0);
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('returns empty array for empty domain string', () => {
      const sessions = scanSessions(slug, '');
      expect(Array.isArray(sessions)).toBe(true);
    });
  });
});

/* ------------------------------------------------------------------ */
/*  scanExercises                                                     */
/* ------------------------------------------------------------------ */

describe('scanExercises', () => {
  const slug = VALID_SLUG;

  describe('JavaScript topic (has exercises)', () => {
    let groups: ExerciseGroup[];

    beforeAll(() => {
      groups = scanExercises(slug);
    });

    it('returns at least 1 exercise group', () => {
      expect(groups.length).toBeGreaterThan(0);
    });

    it('each group has conceptSlug, conceptName, and files', () => {
      for (const g of groups) {
        expect(g).toHaveProperty('conceptSlug');
        expect(g).toHaveProperty('conceptName');
        expect(g).toHaveProperty('files');
        expect(typeof g.conceptSlug).toBe('string');
        expect(typeof g.conceptName).toBe('string');
        expect(Array.isArray(g.files)).toBe(true);
      }
    });

    it('groups are sorted by conceptName alphabetically', () => {
      for (let i = 1; i < groups.length; i++) {
        expect(
          groups[i].conceptName.localeCompare(groups[i - 1].conceptName),
        ).toBeGreaterThanOrEqual(0);
      }
    });

    it('"variables-data-types" group has 4 files', () => {
      const group = groups.find((g) => g.conceptSlug === 'variables-data-types');
      expect(group).toBeDefined();
      expect(group!.conceptName).toBe('变量与数据类型');
      expect(group!.files).toHaveLength(4);
    });

    it('exercise files have name and path', () => {
      for (const g of groups) {
        for (const f of g.files) {
          expect(f).toHaveProperty('name');
          expect(f).toHaveProperty('path');
          expect(typeof f.name).toBe('string');
          expect(typeof f.path).toBe('string');
        }
      }
    });

    it('exercise file names are just the file name, not full paths', () => {
      for (const g of groups) {
        for (const f of g.files) {
          expect(f.name).not.toContain('/');
        }
      }
    });

    it('exercise file paths contain the correct topic and exercises directory', () => {
      for (const g of groups) {
        for (const f of g.files) {
          expect(f.path).toContain(`/topics/${slug}/exercises/`);
        }
      }
    });

    it('exercise file names include expected files', () => {
      const group = groups.find((g) => g.conceptSlug === 'variables-data-types');
      const names = group!.files.map((f) => f.name);
      expect(names).toContain('README.md');
      expect(names).toContain('starter.js');
      expect(names).toContain('solution.js');
      expect(names).toContain('practice-2026-06-14.json');
    });
  });

  describe('edge cases', () => {
    it('returns empty array for non-existent topic', () => {
      const groups = scanExercises(NONEXISTENT_SLUG);
      expect(groups).toHaveLength(0);
      expect(Array.isArray(groups)).toBe(true);
    });

    it('returns empty array for empty slug', () => {
      const groups = scanExercises('');
      expect(groups).toHaveLength(0);
      expect(Array.isArray(groups)).toBe(true);
    });
  });
});

/* ------------------------------------------------------------------ */
/*  loadSessionContent                                                */
/* ------------------------------------------------------------------ */

describe('loadSessionContent', () => {
  it('loads content for a valid session path', async () => {
    const sessions = scanSessions(VALID_SLUG, 'language-basics');
    const content = await loadSessionContent(sessions[0].path);
    expect(content).not.toBeNull();
    expect(content).toContain('Language Basics');
  });

  it('returns null for a non-existent path', async () => {
    expect(await loadSessionContent('/nonexistent/path.md')).toBeNull();
  });

  it('returns null for an empty string path', async () => {
    expect(await loadSessionContent('')).toBeNull();
  });

  it('returns non-empty markdown content for all session files', async () => {
    const sessions = scanSessions(VALID_SLUG, 'language-basics');
    for (const s of sessions) {
      const content = await loadSessionContent(s.path);
      expect(content).not.toBeNull();
      expect(content!.length).toBeGreaterThan(0);
    }
  });
});

/* ------------------------------------------------------------------ */
/*  loadExerciseContent                                               */
/* ------------------------------------------------------------------ */

describe('loadExerciseContent', () => {
  it('loads content for a valid exercise path', async () => {
    const groups = scanExercises(VALID_SLUG);
    const readme = groups
      .find((g) => g.conceptSlug === 'variables-data-types')!
      .files.find((f) => f.name === 'README.md')!;

    const content = await loadExerciseContent(readme.path);
    expect(content).not.toBeNull();
    expect(content).toContain('Variables and Data Types');
  });

  it('returns null for a non-existent path', async () => {
    expect(await loadExerciseContent('/nonexistent/path.md')).toBeNull();
  });

  it('returns null for an empty string path', async () => {
    expect(await loadExerciseContent('')).toBeNull();
  });

  it('loads a JavaScript file as raw text', async () => {
    const groups = scanExercises(VALID_SLUG);
    const starter = groups
      .find((g) => g.conceptSlug === 'variables-data-types')!
      .files.find((f) => f.name === 'starter.js')!;

    const content = await loadExerciseContent(starter.path);
    expect(content).not.toBeNull();
    expect(typeof content).toBe('string');
  });

  it('loads a JSON file as raw text', async () => {
    const groups = scanExercises(VALID_SLUG);
    const jsonFile = groups
      .find((g) => g.conceptSlug === 'variables-data-types')!
      .files.find((f) => f.name === 'practice-2026-06-14.json')!;

    const content = await loadExerciseContent(jsonFile.path);
    expect(content).not.toBeNull();
    expect(typeof content).toBe('string');
  });
});

/* ------------------------------------------------------------------ */
/*  Cross-function integration                                        */
/* ------------------------------------------------------------------ */

describe('integration: data consistency', () => {
  it('listAllTopics → loadTopic round-trips correctly', () => {
    const summaries = listAllTopics();
    for (const summary of summaries) {
      const state = loadTopic(summary.slug);
      expect(state).not.toBeNull();
      expect(state!.topic).toBe(summary.name);
      expect(state!.domains.length).toBe(summary.domainCount);
    }
  });

  it('scanSessions + loadSessionContent provides valid markdown', async () => {
    const sessions = scanSessions(VALID_SLUG, 'language-basics');
    expect(sessions.length).toBeGreaterThan(0);
    for (const s of sessions) {
      const content = await loadSessionContent(s.path);
      expect(content).not.toBeNull();
      expect(content!.length).toBeGreaterThan(0);
    }
  });

  it('scanExercises + loadExerciseContent return consistent data', async () => {
    const groups = scanExercises(VALID_SLUG);
    for (const group of groups) {
      for (const file of group.files) {
        const content = await loadExerciseContent(file.path);
        expect(content).not.toBeNull();
        expect(typeof content).toBe('string');
      }
    }
  });

  it('topic page flow: loadTopic then scanSessions for each domain', () => {
    const state = loadTopic(VALID_SLUG)!;
    let totalSessions = 0;
    for (const domain of state.domains) {
      const sessions = scanSessions(VALID_SLUG, domain.slug);
      totalSessions += sessions.length;
      for (const s of sessions) {
        expect(s.path).toContain(`/${domain.slug}/`);
      }
    }
    expect(totalSessions).toBe(3);
  });

  it('session content loaded on demand matches expected content', async () => {
    const sessions = scanSessions(VALID_SLUG, 'language-basics');
    const newest = sessions[0];
    const content = await loadSessionContent(newest.path);
    expect(content).not.toBeNull();
    expect(content).toContain('Language Basics');
  });
});
