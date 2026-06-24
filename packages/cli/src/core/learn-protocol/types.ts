/** Valid status values for a concept's learning state. */
export type ConceptStatus = 'unexplored' | 'in_progress' | 'needs_practice' | 'mastered';

/** A third-level detail under a concept — plain name, no independent state. */
export type Detail = string;

/** A single concept within a domain — the minimum trackable unit. */
export interface Concept {
  name: string;
  slug: string;
  status: ConceptStatus;
  confidence: number; // 0.0 – 1.0
  practice_count: number;
  explain_count: number;
  last_explained: string | null; // YYYY-MM-DD or YYYY-MM-DD HH:mm:ss, or null
  last_practiced: string | null; // YYYY-MM-DD or YYYY-MM-DD HH:mm:ss, or null
  details: Detail[];
}

/** A top-level knowledge domain containing concepts. */
export interface Domain {
  name: string;
  slug: string;
  concepts: Concept[];
}

/** state.json v1 top-level structure — the single source of truth. */
export interface StateV1 {
  version: 1;
  topic: string;
  slug: string;
  created: string; // YYYY-MM-DD or YYYY-MM-DD HH:mm:ss
  domains: Domain[];
}

/** Grading strategy for a quiz question — drives dashboard auto-grading behavior. */
export type QuestionGradeable = 'exact' | 'accepted' | 'ai_only';

/** Supported quiz question types — text-answer only (coding is handled by /learn:practice). */
export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_in_blank' | 'error_correction';

/** A single question in a persisted quiz deck (quiz.json v1). */
export interface QuizQuestion {
  id: string;
  type: QuestionType;
  gradeable: QuestionGradeable;
  prompt: string;
  explanation: string;
  /** multiple_choice only. */
  options?: string[];
  /** Canonical/reference answer. multiple_choice: correct option text. true_false: true|false. Otherwise: reference text. */
  answer: string | boolean;
  /** fill_in_blank only: accepted alternative phrasings for best-effort auto-grading. */
  accepted_answers?: string[];
}

/** A persisted, reusable quiz deck for one concept (quiz.json v1). */
export interface QuizDeck {
  version: 1;
  topic: string;
  topic_slug: string;
  concept_slug: string;
  concept_name: string;
  created: string; // YYYY-MM-DD HH:mm:ss
  questions: QuizQuestion[];
}

/* ------------------------------------------------------------------ */
/*  v0 types — used only during migration                             */
/* ------------------------------------------------------------------ */

/** A single concept entry in v0 state.yaml. */
export interface V0Concept {
  path: string; // e.g. "Functions/Closures"
  status: string;
  last_practiced: string | null;
  practice_count: number;
  confidence: number;
  /** v0 used `last_session` — migrate maps it to `last_explained`. */
  last_session?: string | null;
  explain_count?: number;
}

/** Top-level shape of v0 state.yaml. */
export interface V0State {
  topic: string;
  created: string;
  concepts: V0Concept[];
}

/** Parsed structure extracted from v0 knowledge-map.md. */
export interface ParsedConcept {
  name: string;
  children: string[]; // third-level details
}

/** A domain extracted from v0 knowledge-map.md. */
export interface ParsedDomain {
  name: string;
  concepts: ParsedConcept[];
}

/** Result of parsing a v0 knowledge-map.md. */
export interface ParsedKnowledgeMap {
  topic: string;
  domains: ParsedDomain[];
}
