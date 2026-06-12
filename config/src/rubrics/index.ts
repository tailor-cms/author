// Scoring rubric registry + feedback config resolution. Mirrors the
// workflow pattern: rubrics are defined here, schemas reference them
// by id via `feedback.rubrics`
import type {
  ResolvedFeedbackConfig,
  ScoringRubric,
} from '@tailor-cms/interfaces/feedback';

import { ACCESSIBILITY_RUBRIC } from './accessibility.rubric';
import { ASSESSMENT_CRAFT_RUBRIC } from './assessment-craft.rubric';
import { CLARITY_RUBRIC } from './clarity.rubric';
import { COGNITIVE_DEPTH_RUBRIC } from './cognitive-depth.rubric';
import { CREDIBILITY_RUBRIC } from './credibility.rubric';
import { HEAS_RUBRIC } from './heas.rubric';
import { LEARNING_DESIGN_RUBRIC } from './learning-design.rubric';
import { READINESS_RUBRIC } from './readiness.rubric';

export const RUBRICS: ScoringRubric[] = [
  READINESS_RUBRIC,
  CLARITY_RUBRIC,
  ACCESSIBILITY_RUBRIC,
  LEARNING_DESIGN_RUBRIC,
  HEAS_RUBRIC,
  COGNITIVE_DEPTH_RUBRIC,
  CREDIBILITY_RUBRIC,
  ASSESSMENT_CRAFT_RUBRIC,
];

/**
 * Build the feedback api bound to a schema registry. Feedback is on
 * for every schema with all registered rubrics unless the schema opts
 * out (`feedback: { enabled: false }`) or narrows the set
 * (`feedback: { rubrics: [...] }`). Unknown rubric ids are dropped
 * with a warning rather than failing the whole feature.
 */
export const getFeedbackApi = (rubrics: ScoringRubric[], schemaApi: any) => {
  const getRubric = (id: string): ScoringRubric | undefined =>
    rubrics.find((it) => it.id === id);

  const resolveConfig = (schemaId: string): ResolvedFeedbackConfig => {
    const schema = schemaApi.getSchema(schemaId);
    const config = schema?.feedback ?? {};
    const isEnabled = config.enabled !== false;
    const resolved: ScoringRubric[] = config.rubrics?.length
      ? config.rubrics
          .map((id: string) => {
            const rubric = getRubric(id);
            if (!rubric) {
              console.warn(`Unknown scoring rubric "${id}" in ${schemaId}`);
            }
            return rubric;
          })
          .filter((it): it is ScoringRubric => !!it)
      : rubrics;
    return { isEnabled: isEnabled && resolved.length > 0, rubrics: resolved };
  };

  return { rubrics, getRubric, resolveConfig };
};
