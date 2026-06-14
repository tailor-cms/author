/**
 * Types for the AI feedback (review sidebar) feature.
 *
 * Scoring rubrics are defined in the config package
 * (config/src/rubrics, the same pattern as workflows) and consumed by
 * both the backend (review runner) and the frontend (sidebar) through
 * `@tailor-cms/config`.
 */
export interface RubricDimension {
  // Stable identifier referenced by results and trend snapshots
  key: string;
  // Display label rendered by the feedback sidebar
  label: string;
  // MDI icon name rendered next to the dimension
  icon: string;
  // Upper score bound for this dimension
  maxScore: number;
  /**
   * Scoring guidance sent to the reviewer AI - describes what earns
   * the low, mid, and top of the score range so scores stay
   * comparable across runs and activities.
   */
  guidance: string;
}

/**
 * A scoring rubric: the review framework (dimensions + reviewer lens)
 * authored content is evaluated against.
 */
export interface ScoringRubric {
  // Stable identifier referenced by schema `feedback.rubrics` config
  id: string;
  // Display name rendered as the sidebar title
  name: string;
  // Short description of what the rubric measures, shown to authors
  description: string;
  /**
   * Reviewer instructions specific to this rubric - the perspective
   * the AI should adopt while reading the content, beyond the
   * per-dimension guidance.
   */
  lens: string;
  dimensions: RubricDimension[];
}

export interface ResolvedFeedbackConfig {
  isEnabled: boolean;
  // Rubrics enabled for the schema, first entry is the default
  rubrics: ScoringRubric[];
}

export interface FeedbackDimensionScore {
  key: string;
  score: number;
  maxScore: number;
  rationale: string;
  evidence: string[];
}

export interface FeedbackStrength {
  title: string;
  detail: string;
}

export type FeedbackSuggestionImpact = 'high' | 'medium' | 'low';

export interface FeedbackSuggestion {
  title: string;
  detail: string;
  impact: FeedbackSuggestionImpact;
  dimensionKeys: string[];
  targetElementId?: number | null;
  // Self-contained instruction for the authoring agent
  agentPrompt?: string;
}

export interface FeedbackResult {
  rubricId: string;
  activityId: number;
  // Content signature the review was computed against
  contentSignature: string;
  // Unix ms when the review completed
  computedAt: number;
  overall: {
    score: number;
    maxScore: number;
    headline: string;
    summary: string;
  };
  dimensions: FeedbackDimensionScore[];
  strengths: FeedbackStrength[];
  suggestions: FeedbackSuggestion[];
}

export interface FeedbackTrendPoint {
  computedAt: number;
  score: number;
  maxScore: number;
  dimensions: Record<string, number>;
}

export type FeedbackState = 'empty' | 'running' | 'ready' | 'failed';

export interface FeedbackStatus {
  status: FeedbackState;
  // True when content changed since the result was computed
  isStale: boolean;
  result: FeedbackResult | null;
  // Recent score snapshots, oldest first, current included
  trend: FeedbackTrendPoint[];
  error: string | null;
}
