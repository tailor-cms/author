// Prompt builder for CcContainer.
import type {
  AiActivityConfig,
  ContentSubcontainer,
  Metadata,
} from '@tailor-cms/interfaces/schema';
import {
  MEDIA_DESCRIPTIONS,
  isVideoFile,
  isVideoLink,
  resolveAssetElementType,
} from './media.ts';
import type { AiContext, AssetReference } from '@tailor-cms/interfaces/ai.ts';
import { getCeAiSpec, resolveSupportedTypes } from './schema.ts';
import type { FlatConfig, NestedConfig, PropsConfig } from './types.ts';
import elementRegistry from '../../../content-plugins/elementRegistry.js';
import { getConfigs } from './config.ts';
import { schema as schemaAPI } from '@tailor-cms/config';
import { oneLine } from 'common-tags';

type ContainerAi = AiActivityConfig | undefined;

// Append the schema author's per-container override rule, when set.
// Pushed last so it takes precedence over the upstream guidelines.
const appendOutputRules = (guidelines: string[], ai: ContainerAi): void => {
  if (ai?.outputRules?.prompt) guidelines.push(ai.outputRules.prompt.trim());
};

const describeField = (field: Metadata): string => {
  const base = `"${field.key}" (${field.label})`;
  const options = field.options || field.items;
  const opts = options?.map((o: any) => o.value).join(', ');
  return opts ? `${base} [options: ${opts}]` : base;
};

// Extract a human-readable description from an element's getPrompt().
// Convention: prompts start with "Generate a <description> as an
// object...". Falls back to the raw type id if no prompt or no match.
const extractElementDescription = (type: string): string => {
  const spec = getCeAiSpec(type);
  if (!spec?.getPrompt) return type;
  const prompt = spec.getPrompt();
  if (!prompt) return type;
  const match = prompt.match(/generate\s+(.+?)\s+as\s+an/i);
  return match?.[1] || type;
};

const describeElementTypes = (types: string[], hasAssets = false): string => {
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

const describeSubcontainerTypes = (subs: ContentSubcontainer[]): string =>
  subs
    .map((sub) => {
      const meta = sub.meta || [];
      const fields = meta.map(describeField).join(', ');
      const suffix = fields ? `: metadata fields: ${fields}` : '';
      return `  - Type "${sub.type}" (${sub.label})${suffix}`;
    })
    .join('\n');

const describeDefaultSubcontainers = (
  defaults: NestedConfig['defaultSubcontainers'],
  subs: ContentSubcontainer[],
): string =>
  defaults
    .map((sub) => {
      const label = subs.find((s) => s.type === sub.type)?.label || sub.type;
      const title = sub.data?.title as string | undefined;
      return title ? `  - "${title}" (${label})` : `  - ${label}`;
    })
    .join('\n');

// All currently-usable assets; vector store handles relevance.
const buildAssetCatalog = (assets: AssetReference[]): string => {
  const usable = assets.filter(
    (it) => it.publicUrl || it.meta?.url || it.storageKey,
  );
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

// Shared guidance lines applied to every shape that emits content
// elements (nested, flat) and partially to props for element-typed
// slots. HTML formatting, asset rules, vector store grounding,
// schema-author ai.outputRules.
const sharedElementGuidelines = (
  context: AiContext,
  ai: ContainerAi,
  hasAssets: boolean,
  elementTypes: string[],
): string[] => {
  const guidelines: string[] = [];
  guidelines.push(
    'HTML elements:',
    '- Use <ul>/<ol>, <blockquote>, <strong> for variety',
    '- Accent important sections with CSS classes:',
    '  "ce-highlight" for key takeaways,',
    '  "ce-callout" for tips/warnings,',
    '  "ce-example" for worked examples.',
    '  Add minimal inline style as default fallback',
    '  (e.g. border-left, background) — presentation',
    '  layer can override these classes',
  );
  // Perspective / voice / shape is set by the schema's
  // ai.contentMode and injected by AiPrompt.buildAuthoringRules
  // (Pedagogical / Reference / Editorial / Narrative / Analytical).
  const hasQuestions = elementTypes.some((t) => elementRegistry.isQuestion(t));
  if (hasQuestions) {
    guidelines.push(
      '- Place a question after teaching a concept -',
      '  it should check understanding of what was',
      '  just explained, not test random knowledge',
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
  return guidelines;
};

// Top-level container prompt builder.
// Dispatches to shape-specific builders.
export const getPrompt = (context: AiContext): string => {
  const cfg = getConfigs(context);
  switch (cfg.shape) {
    case 'nested':
      return getNestedPrompt(cfg, context);
    case 'flat':
      return getFlatPrompt(cfg, context);
    case 'props':
      return getPropsPrompt(cfg, context);
  }
};

function getNestedPrompt(cfg: NestedConfig, context: AiContext): string {
  const { container, subcontainers, defaultSubcontainers } = cfg;
  const { ai: containerAiConfig, contentElementConfig } = container;
  const defaultCeTypes =
    schemaAPI.getSupportedElementTypes(contentElementConfig);
  const supportedElementTypes = [
    ...new Set(
      subcontainers.flatMap((sub) =>
        sub.elementConfig?.length
          ? schemaAPI.getSupportedElementTypes(sub.elementConfig)
          : defaultCeTypes,
      ),
    ),
  ];
  const hasAssets = !!context.assets?.length;
  const hasSchemaContentRules = !!containerAiConfig?.outputRules?.prompt;
  const hasQuestions = supportedElementTypes.some((t) =>
    elementRegistry.isQuestion(t),
  );
  const guidelines: string[] = [
    '- Fill in ALL metadata fields',
    '- Each subcontainer: a distinct topic, scene, beat, or aspect',
    '- Do NOT duplicate metadata inside the element body.',
    '  When a subcontainer has a title / name / heading meta field,',
    '  do not repeat it as a heading or label at the top of the',
    '  content, the renderer shows meta separately. Likewise, do',
    '  not narrate other meta (description, mood, layout, panel',
    '  number, position) inline in prose; structure already conveys',
    '  ordering.',
  ];
  guidelines.push(
    ...sharedElementGuidelines(
      context,
      containerAiConfig,
      hasAssets,
      supportedElementTypes,
    ),
  );
  if (!hasSchemaContentRules) {
    guidelines.push(
      '- Cover each subcontainer thoroughly — substantive,',
      '  not superficial',
    );
  }
  if (hasQuestions) {
    guidelines.push(oneLine`
      - Max one question per subcontainer unless the subcontiner is
        specifically for questions (e.g. "Quiz" or "Exercise" type).`);
  }
  if (hasAssets) {
    guidelines.push('- Max 3 media elements per subcontainer');
  }
  if (defaultSubcontainers.length) {
    guidelines.push(`
      - Generate exactly these subcontainers, in this order, with
      titles exactly as listed (do not rephrase the titles).
      ${describeDefaultSubcontainers(defaultSubcontainers, subcontainers)}
      If they already exist (check by title) append new content to them`);
  }
  appendOutputRules(guidelines, containerAiConfig);
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
}

function getFlatPrompt(cfg: FlatConfig, context: AiContext): string {
  const { elementTypes, container } = cfg;
  const { ai: containerAiConfig } = container;
  const containerLabel = container.label || container.type;
  const multiple = !!container.multiple;
  const hasAssets = !!context.assets?.length;
  const guidelines: string[] = [];
  if (multiple) {
    guidelines.push(
      `- Each item is a NEW "${containerLabel}" sibling container`,
      '- Vary across items: distinct angle, scope, or section per item',
    );
  } else {
    guidelines.push(
      `- Generate exactly one "${containerLabel}" item; elements append`,
      '  into the existing container (find-or-create on the write side)',
    );
  }
  guidelines.push(
    ...sharedElementGuidelines(
      context,
      containerAiConfig,
      hasAssets,
      elementTypes,
    ),
  );
  if (hasAssets) {
    guidelines.push('- Max 3 media elements per container');
  }
  appendOutputRules(guidelines, containerAiConfig);
  const assetSection = hasAssets ? buildAssetCatalog(context.assets!) : '';
  const itemsCardinality = multiple ? 'one or more items' : 'exactly one item';
  return `
    Response: JSON with an "items" array (${itemsCardinality}).
    Each item has:
    - "type": "${container.type}"
    - "elements": array of content elements

    Available element types:
    ${describeElementTypes(elementTypes, hasAssets)}

    Guidelines:
    ${guidelines.join('\n  ')}
    ${assetSection}`;
}

function getPropsPrompt(cfg: PropsConfig, context: AiContext): string {
  const { props, container } = cfg;
  const containerLabel = container.label || container.type;
  const hasAssets = !!context.assets?.length;
  const { ai: containerAiConfig } = container;
  const elementProps = props.filter((p) => p.isContentElement);
  const elementTypes = [...new Set(elementProps.map((p) => p.type))];
  const propLines = props
    .map((p) => {
      const required = p.required === false ? ' [optional]' : '';
      const kind = p.isContentElement
        ? `a "${p.type}" content element`
        : `a ${p.type} value`;
      return `  - "${p.key}" (${p.label})${required}: ${kind}`;
    })
    .join('\n');
  const guidelines: string[] = [
    `- Fill every listed slot in the "${containerLabel}" container`,
    `- Match each slot's declared type exactly`,
    `- Element-typed slots: emit the element's content body only`,
    '  (no `type` wrapper) - the slot key fixes the type',
  ];
  if (elementTypes.length) {
    guidelines.push(
      ...sharedElementGuidelines(
        context,
        containerAiConfig,
        hasAssets,
        elementTypes,
      ),
    );
  }
  appendOutputRules(guidelines, containerAiConfig);
  const elementSection = elementTypes.length
    ? [
        'Element-typed slot bodies follow these per-type schemas:',
        `  ${describeElementTypes(elementTypes, hasAssets)}`,
        '',
      ].join('\n')
    : '';
  const assetSection = hasAssets ? buildAssetCatalog(context.assets!) : '';
  return `
    Response: JSON with a "data" object whose keys match the slot
    names below. Each slot value follows the declared kind:

    ${propLines}

    ${elementSection}

    Guidelines:
    ${guidelines.join('\n  ')}
    ${assetSection}`;
}
