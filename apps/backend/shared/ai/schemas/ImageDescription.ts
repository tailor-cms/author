import { stripIndent } from 'common-tags';

import type { OpenAISchema } from './interfaces.js';

export const PROMPT = stripIndent`
  Analyze this image thoroughly and provide:
  1. A concise description (1-2 sentences) suitable for
     alt text and search
  2. Relevant tags (5-10 keywords)
  3. A brief analysis of what the image depicts and how it
     could be used in educational content
  4. Quality grade: "high" (sharp, professional, clear),
     "medium" (acceptable but not ideal), or "low" (blurry,
     low-res, watermarked, screenshot artifacts, stock photo
     with visible watermark)
  5. Quality issues: list any problems found (e.g. "watermark
     visible", "low resolution", "text hard to read",
     "irrelevant content", "heavily compressed")
  6. Relevance score: 0-10 rating of how useful this image
     would be in educational/training content (10 = perfect
     diagram or illustration, 5 = generic but usable,
     0 = irrelevant or unusable)
  7. Content suggestion: one sentence on where/how to best
     use this image in a course
`;

export const Schema: OpenAISchema = {
  type: 'json_schema',
  name: 'image_description',
  schema: {
    type: 'object',
    properties: {
      description: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      analysis: { type: 'string' },
      quality: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
      },
      qualityIssues: { type: 'array', items: { type: 'string' } },
      relevanceScore: { type: 'number' },
      contentSuggestion: { type: 'string' },
    },
    required: [
      'description', 'tags', 'analysis',
      'quality', 'qualityIssues', 'relevanceScore',
      'contentSuggestion',
    ],
    additionalProperties: false,
  },
};
