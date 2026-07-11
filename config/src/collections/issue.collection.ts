import type { ContentElement } from '@tailor-cms/interfaces/content-element.ts';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

import {
  IsContentElement,
  IsInput,
  Prop,
  TailorCollection,
  TailorEntity,
} from '../lib/index.ts';
import { OUTLINE_COLOR } from '../colors';

// Mirrors the `area` dropdown shared by both GitHub issue forms
// (.github/ISSUE_TEMPLATE/{bug_report,proposal}.yml).
const AREA_OPTIONS = [
  { value: 'EDITOR', label: 'Authoring / editor' },
  { value: 'CONTENT_ELEMENTS', label: 'Content elements' },
  { value: 'CONTENT_CONTAINERS', label: 'Content containers' },
  { value: 'REPOSITORY', label: 'Repository / structure' },
  { value: 'ASSETS', label: 'Media / assets' },
  { value: 'CONTENT_LINKING', label: 'Content linking' },
  { value: 'COLLECTIONS', label: 'Collections' },
  { value: 'PUBLISHING', label: 'Publishing' },
  { value: 'AI', label: 'AI features' },
  { value: 'ADMIN', label: 'Admin / access / auth' },
  { value: 'BACKEND', label: 'Backend / API' },
  { value: 'EXTENSIONS', label: 'Extensions (ce/cc/mi/pl)' },
  { value: 'INFRA', label: 'Infra / CI' },
  { value: 'OTHER', label: 'Other' },
];

const SEVERITY_OPTIONS = [
  { value: 'S1', label: 'S1 - Critical (data loss, crash, security, blocked release)' },
  { value: 'S2', label: 'S2 - Major (core flow broken, no workaround)' },
  { value: 'S3', label: 'S3 - Minor (broken, but there is a workaround)' },
  { value: 'S4', label: 'S4 - Cosmetic / trivial' },
];

const PROPOSAL_TYPE_OPTIONS = [
  { value: 'FEATURE', label: 'Feature (new capability)' },
  { value: 'ENHANCEMENT', label: 'Enhancement (improve something that exists)' },
  { value: 'TASK', label: 'Task (chore / refactor / config)' },
  { value: 'DOCUMENTATION', label: 'Documentation' },
];

class BugSchema {
  @Prop({ label: 'Summary' })
  @IsInput(MetaInputType.TextField, {
    isTitle: true,
    placeholder: 'One or two sentences describing the defect',
    validate: { required: true, min: 2, max: 200 },
  })
  summary: string;

  @Prop({ label: 'Severity' })
  @IsInput(MetaInputType.Select, {
    placeholder: 'Impact if shipped (not scheduling urgency)',
    options: SEVERITY_OPTIONS,
    defaultValue: 'S2',
    validate: { required: true },
  })
  severity: string;

  @Prop({ label: 'Affected area' })
  @IsInput(MetaInputType.Select, {
    placeholder: 'Select the affected area',
    options: AREA_OPTIONS,
    validate: { required: true },
  })
  area: string;

  @Prop({ label: 'Schema / container involved' })
  @IsInput(MetaInputType.TextField, {
    placeholder: 'e.g. Course schema, Structured Content container',
    validate: { max: 200 },
  })
  schemaInvolved: string;

  @Prop({ label: 'Last known good commit / version' })
  @IsInput(MetaInputType.TextField, {
    placeholder: 'e.g. bfc0276c; leave blank if unsure',
    validate: { max: 100 },
  })
  lastKnownGood: string;

  @Prop({ label: 'Steps to reproduce' })
  @IsInput(MetaInputType.Textarea, {
    placeholder: 'Numbered, deterministic steps; include test data / URLs',
    validate: { required: true, max: 4000 },
  })
  steps: string;

  @Prop({ label: 'Expected result' })
  @IsInput(MetaInputType.Textarea, {
    validate: { required: true, max: 2000 },
  })
  expected: string;

  @Prop({ label: 'Environment' })
  @IsInput(MetaInputType.Textarea, {
    placeholder:
      'Browser / Playwright project, OS, app commit, ' +
      'environment (local / staging / prod)',
    validate: { required: true, max: 2000 },
  })
  environment: string;

  @Prop({ label: 'Relevant log output' })
  @IsInput(MetaInputType.Textarea, {
    placeholder: 'Server / browser console logs',
    validate: { max: 8000 },
  })
  logs: string;

  // Evidence goes here: screenshots, video, or a Playwright trace.
  @Prop({ label: 'Actual result' })
  @IsContentElement(ContentElementType.TiptapHtml, { required: true })
  actual: ContentElement;
}

class ProposalSchema {
  @Prop({ label: 'Summary' })
  @IsInput(MetaInputType.TextField, {
    isTitle: true,
    placeholder: 'One or two sentences describing the proposal',
    validate: { required: true, min: 2, max: 200 },
  })
  summary: string;

  @Prop({ label: 'Type' })
  @IsInput(MetaInputType.Select, {
    placeholder: 'What kind of work is this?',
    options: PROPOSAL_TYPE_OPTIONS,
    validate: { required: true },
  })
  proposalType: string;

  @Prop({ label: 'Affected area' })
  @IsInput(MetaInputType.Select, {
    placeholder: 'Select the affected area',
    options: AREA_OPTIONS,
    validate: { required: true },
  })
  area: string;

  @Prop({ label: 'Schema / container involved' })
  @IsInput(MetaInputType.TextField, {
    placeholder: 'e.g. Course schema, Structured Content container',
    validate: { max: 200 },
  })
  schemaInvolved: string;

  @Prop({ label: 'Motivation / problem' })
  @IsInput(MetaInputType.Textarea, {
    placeholder:
      'What problem does this solve, or what is the value? ' +
      'Who is affected and when?',
    validate: { required: true, max: 4000 },
  })
  motivation: string;

  @Prop({ label: 'Current behavior' })
  @IsInput(MetaInputType.Textarea, {
    placeholder: 'How it works today, if this changes existing behavior',
    validate: { max: 4000 },
  })
  current: string;

  @Prop({ label: 'Acceptance criteria' })
  @IsInput(MetaInputType.Textarea, {
    placeholder: 'How we know it is done; bullet the checks / cases',
    validate: { max: 4000 },
  })
  acceptance: string;

  @Prop({ label: 'Alternatives / additional context' })
  @IsInput(MetaInputType.Textarea, {
    placeholder: 'Other approaches considered, mockups, links, prior art',
    validate: { max: 4000 },
  })
  alternatives: string;

  // Sketch the UX or approach; link code paths, drop in mockups.
  @Prop({ label: 'Proposed solution / behavior' })
  @IsContentElement(ContentElementType.TiptapHtml, { required: true })
  proposal: ContentElement;
}

const Bug = new TailorEntity(BugSchema, {
  type: 'BUG',
  label: 'Bug',
  icon: 'mdi-bug-outline',
  color: OUTLINE_COLOR.ACCENT_4,
  embedElementConfig: [
    ContentElementType.TiptapHtml,
    ContentElementType.Image,
    ContentElementType.Video,
    ContentElementType.File,
  ],
  ai: {
    definition: `
      A reproducible defect report. Summary states the defect in one or
      two sentences; steps are numbered and deterministic; expected and
      actual results are stated separately. Evidence (screenshots,
      video, traces) lives in the Actual result body.`,
  },
});

const Proposal = new TailorEntity(ProposalSchema, {
  type: 'PROPOSAL',
  label: 'Proposal',
  icon: 'mdi-lightbulb-outline',
  color: OUTLINE_COLOR.ACCENT_1,
  embedElementConfig: [
    ContentElementType.TiptapHtml,
    ContentElementType.Image,
    ContentElementType.Embed,
  ],
  ai: {
    definition: `
      A proposal for a feature, enhancement, task, or documentation
      change. Motivation states the problem and who is affected; the
      proposed solution sketches the desired behavior or approach;
      acceptance criteria enumerate how we know it is done.`,
  },
});

export const issueCollection = new TailorCollection({
  id: 'ISSUE_COLLECTION',
  name: 'Issues',
  description:
    'Bug reports and proposals, mirroring the GitHub issue forms.',
  entities: [Bug, Proposal],
});
