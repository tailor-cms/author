// Prompt builder for structured content generation.
// Assembles element descriptions, subcontainer types,
// guidelines, and asset catalog into the system prompt.
import type { AiContext, AssetReference } from '@tailor-cms/interfaces/ai.ts';

import elementRegistry from '../../../content-plugins/elementRegistry.js';
import { getConfigs } from './config.ts';
import {
  MEDIA_DESCRIPTIONS,
  isVideoFile,
  isVideoLink,
  resolveAssetElementType,
} from './media.ts';
import { getAiSpec, resolveSupportedTypes } from './schema.ts';
import type { MetaField, ParsedConfig, SubcontainerConfigs } from './types.ts';

const describeField = ({ key, label, options }: MetaField): string => {
  const base = `"${key}" (${label})`;
  const opts = options?.map((o) => o.value).join(', ');
  return opts ? `${base} [options: ${opts}]` : base;
};

// Extract a human-readable description from an element's
// getPrompt(). Convention: prompts start with
// "Generate a <description> as an object...".
// Falls back to the raw type ID if no prompt or no match.
const extractElementDescription = (type: string): string => {
  const spec = getAiSpec(type);
  if (!spec?.getPrompt) return type;
  const prompt = spec.getPrompt();
  if (!prompt) return type;
  // "Generate a accordion content element as an" → "a accordion...."
  const match = prompt.match(/generate\s+(.+?)\s+as\s+an/i);
  return match?.[1] || type;
};

// Build element type descriptions for the prompt.
// When hasAssets is true, IMAGE and EMBED types are
// appended so the AI knows it can reference media.
const describeElementTypes = (
  types: string[],
  hasAssets = false,
): string => {
  const resolved = resolveSupportedTypes(types);
  const lines = resolved.map((type) => {
    const desc = extractElementDescription(type);
    return `  - "${type}": ${desc}`;
  });
  if (hasAssets) {
    for (const [type, desc] of Object.entries(MEDIA_DESCRIPTIONS)) {
      if (!resolved.includes(type)) {
        lines.push(`  - "${type}": ${desc}`);
      }
    }
  }
  return lines.join('\n');
};

const describeSubcontainerTypes = (configs: SubcontainerConfigs): string => {
  const entries = Object.entries(configs);
  if (!entries.length) {
    return '  - Type "SECTION" (Section)';
  }
  return entries
    .map(([type, { label, metaInputs = [] }]) => {
      const fields = metaInputs.map(describeField).join(', ');
      const suffix = fields ? `: metadata fields: ${fields}` : '';
      return `  - Type "${type}" (${label})${suffix}`;
    })
    .join('\n');
};

// Build asset catalog for the prompt.
// Includes ALL usable assets — vector store file_search
// handles relevance, this just lists valid IDs for the AI.
const buildAssetCatalog = (assets: AssetReference[]): string => {
  const usable = assets.filter((it) => it.publicUrl || it.url || it.storageKey);
  if (!usable.length) return '';
  const lines = usable.map((it) => {
    const media = resolveAssetElementType(it);
    const hint = media ? ` → use as ${media.elementType}` : '';
    const label = media?.label || it.type;
    return `  - ID:${it.id} [${label}] "${it.name}"${hint}`;
  });
  return ['', 'Assets available (reference by assetId):', ...lines].join(
    '\n  ',
  );
};

const buildGuidelines = (
  context: AiContext,
  ai: ParsedConfig['ai'],
  hasAssets: boolean,
  elementTypes: string[],
): string[] => {
  const hasQuestions = elementTypes.some(
    (t) => elementRegistry.isQuestion(t),
  );
  const guidelines = [
    '- Fill in ALL metadata fields',
    '- Each subcontainer: distinct topic or aspect',
  ];
  // Perspective and depth
  guidelines.push(
    '- Write from an educator/teacher perspective:',
    '  clear explanations, progressive complexity,',
    '  practical examples, learning objectives',
    '- Each subcontainer must thoroughly cover its',
    '  topic — substantive, not superficial',
    '- Structure content for effective learning:',
    '  introduce concepts, explain, illustrate, assess',
  );
  // HTML element formatting
  guidelines.push(
    '- HTML elements: use text-body-2 mb-5 on <p>,',
    '  text-h3 mb-7 on headings',
    '- Use <ul>/<ol>, <blockquote>, <strong> for variety',
    '- Accent important sections with CSS classes:',
    '  "ce-highlight" for key takeaways,',
    '  "ce-callout" for tips/warnings,',
    '  "ce-example" for worked examples.',
    '  Add minimal inline style as default fallback',
    '  (e.g. border-left, background) — presentation',
    '  layer can override these classes',
    '- Each HTML element: focused content block,',
    '  300-600 words per element',
    '- Mix element types coherently: text for concepts,',
    '  questions to reinforce learning, media to',
    '  illustrate — each element should serve a',
    '  pedagogical purpose, not just variety for its own sake',
  );
  // Question element guidance
  if (hasQuestions) {
    guidelines.push(
      '- Place a question after teaching a concept —',
      '  it should check understanding of what was',
      '  just explained, not test random knowledge',
      '- Max one question per subcontainer',
      '- Pick the question type best suited to the',
      '  concept being assessed (e.g. true/false for',
      '  facts, multiple choice for distinctions)',
      '- Write clear, unambiguous answer options',
      '- Include plausible distractors in choices',
    );
  }
  if (hasAssets) {
    const hasVideos = context.assets?.some(
      (a) => isVideoLink(a) || isVideoFile(a),
    );
    guidelines.push(
      '- Use assets as SEPARATE elements',
      '- Reference assets by their assetId number',
      '- Images: IMAGE element with assetId,',
      '  NEVER <img> in HTML',
      '- Uploaded videos: VIDEO element with assetId.',
      '  Only for assets marked "→ use as VIDEO"',
      '- Video links (YouTube, Vimeo): EMBED element.',
      '  Only for assets marked "→ use as EMBED"',
      '- NEVER use <img>, <video>, or iframes in HTML',
      '- Place media between text elements',
      '- Max 3 media elements per subcontainer',
    );
    if (hasVideos) {
      guidelines.push(
        '- Include at least 1 video (EMBED or VIDEO) when relevant videos exist',
      );
    }
  } else {
    guidelines.push('- Do not include media elements');
  }
  if (ai?.definition) {
    guidelines.push(`- Context: ${ai.definition}`);
  }
  if (context.repository.vectorStoreId) {
    guidelines.push(
      '- Base content on provided source documents',
      '- Reference specific data and examples',
      '- Do not invent facts, but enrich and deepen',
      '  the material with explanations, context,',
      '  and pedagogical framing beyond the sources',
    );
  }
  if (ai?.outputRules?.prompt) {
    guidelines.push(ai.outputRules.prompt.trim());
  }
  return guidelines;
};

// Example output (ideal case — assets, vector store, schema
// definition all present):
//
//   Response: JSON with a "subcontainers" array.
//   Each subcontainer has:
//   - "type": one of the available subcontainer types
//   - "data": metadata object with described fields
//   - "elements": array of content elements
//
//   Available element types:
//     - "TIPTAP_HTML": rich text for a page
//     - "ACCORDION": a accordion content element
//     - "MULTIPLE_CHOICE": a multiple choice question
//     - "SINGLE_CHOICE": a single choice question
//     - "TRUE_FALSE": a true/false question
//     - "IMAGE": a standalone image element for photos,
//       diagrams. NEVER use <img> tags inside HTML.
//     - "VIDEO": a video player for uploaded video files.
//       Only for assets marked "→ use as VIDEO".
//     - "EMBED": an embedded video player (YouTube, Vimeo).
//       Only for assets marked "→ use as EMBED".
//
//   Available subcontainer types:
//     - Type "SECTION" (Section): metadata fields:
//       "name" (Name)
//
//   Guidelines:
//   - Fill in ALL metadata fields
//   - Each subcontainer: distinct topic or aspect
//   - Max one question element per subcontainer
//   - Write from an educator/teacher perspective:
//     clear explanations, progressive complexity,
//     practical examples, learning objectives
//   - Each subcontainer must thoroughly cover its
//     topic — substantive, not superficial
//   - Structure content for effective learning:
//     introduce concepts, explain, illustrate, assess
//   - HTML elements: use text-body-2 mb-5 on <p>,
//     text-h3 mb-7 on headings
//   - Use <ul>/<ol>, <blockquote>, <strong> for variety
//   - Accent important sections with CSS classes:
//     "ce-highlight" for key takeaways,
//     "ce-callout" for tips/warnings,
//     "ce-example" for worked examples.
//     Add minimal inline style as default fallback
//     (e.g. border-left, background) — presentation
//     layer can override these classes
//   - Each HTML element: focused content block,
//     300-600 words per element
//   - Mix element types coherently: text for concepts,
//     questions to reinforce learning, media to
//     illustrate — each element should serve a
//     pedagogical purpose, not just variety for its sake
//   - Place a question after teaching a concept —
//     it should check understanding of what was
//     just explained, not test random knowledge
//   - Max one question per subcontainer
//   - Pick the question type best suited to the
//     concept being assessed (e.g. true/false for
//     facts, multiple choice for distinctions)
//   - Write clear, unambiguous answer options
//   - Include plausible distractors in choices
//   - Use assets as SEPARATE elements
//   - Reference assets by their assetId number
//   - Images: IMAGE element with assetId,
//     NEVER <img> in HTML
//   - Uploaded videos: VIDEO element with assetId.
//     Only for assets marked "→ use as VIDEO"
//   - Video links (YouTube, Vimeo): EMBED element.
//     Only for assets marked "→ use as EMBED"
//   - NEVER use <img>, <video>, or iframes in HTML
//   - Place media between text elements
//   - Max 2 media elements per subcontainer
//   - Context: Introduction to machine learning
//   - Base content on provided source documents
//   - Reference specific data and examples
//   - Do not invent facts, but enrich and deepen
//     the material with explanations, context,
//     and pedagogical framing beyond the sources
//
//   Assets available (reference by assetId):
//     - ID:12 [image] "Neural network diagram" → use as IMAGE
//     - ID:23 [video] "Lab demo recording" → use as VIDEO
//     - ID:34 [video link] "Intro to ML - YouTube" → use as EMBED
//     - ID:56 [document] "ML Textbook Chapter 1"
export const getPrompt = (context: AiContext) => {
  const { subcontainers, ai } = getConfigs(context);
  const supportedElementTypes = [
    ...new Set(Object.values(subcontainers).flatMap((c) => c.elementTypes)),
  ];
  const hasAssets = !!context.assets?.length;
  const guidelines = buildGuidelines(
    context, ai, hasAssets, supportedElementTypes,
  );
  const assetSection = hasAssets ? buildAssetCatalog(context.assets!) : '';
  return `
  Response: JSON with a "subcontainers" array.
  Each subcontainer has:
  - "type": one of the available subcontainer types
  - "data": metadata object with described fields
  - "elements": array of content elements

  Available element types:
  ${describeElementTypes(supportedElementTypes, hasAssets)}

  Available subcontainer types:
  ${describeSubcontainerTypes(subcontainers)}

  Guidelines:
  ${guidelines.join('\n  ')}
  ${assetSection}`;
};
