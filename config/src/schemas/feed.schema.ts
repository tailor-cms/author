import type {
  ActivityConfig,
  ContentContainerConfig,
  Metadata,
  Schema,
} from '@tailor-cms/interfaces/schema';
import { ContentMode } from '@tailor-cms/interfaces/schema';
import { ContentContainerType } from '@tailor-cms/content-container-collection/types.js';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

import { OUTLINE_COLOR } from '../colors';
import { DEFAULT_WORKFLOW } from '../workflows/default.workflow';
import { IMAGE_INPUT_EXT } from '../file-extensions';

enum ActivityType {
  Article = 'ARTICLE',
  Event = 'EVENT',
  Group = 'GROUP',
  GrowthOpportunity = 'GROWTH_OPPORTUNITY',
  Podcast = 'PODCAST',
  Section = 'SECTION',
}

const defaultMeta: Metadata[] = [
  {
    key: 'description',
    type: MetaInputType.Html,
    label: 'Description',
  },
  {
    key: 'thumbnail',
    type: MetaInputType.File,
    label: 'Thumbnail Image',
    placeholder: 'Click to add a thumbnail image',
    icon: 'mdi-image',
    validate: {
      ext: IMAGE_INPUT_EXT,
    },
    showPreview: true,
  },
  {
    key: 'tags',
    type: MetaInputType.Combobox,
    label: 'Tags',
    placeholder: 'Tags',
    multiple: true,
    options: [],
  },
];

const podcastMeta: Metadata[] = [
  {
    key: 'spotifyLink',
    type: MetaInputType.Textarea,
    label: 'Spotify Link',
    placeholder: 'Enter a valid Spotify link',
    validate: { url: true },
    rows: 1,
  },
  {
    key: 'youtubeLink',
    type: MetaInputType.Textarea,
    label: 'YouTube Link',
    placeholder: 'Enter a valid YouTube link',
    validate: { url: true },
    rows: 1,
  },
  {
    key: 'applePodcastLink',
    type: MetaInputType.Textarea,
    label: 'Apple Podcast Link',
    placeholder: 'Enter a valid Apple Podcast link',
    validate: { url: true },
    rows: 1,
  },
];

const GROUP: ActivityConfig = {
  type: ActivityType.Group,
  rootLevel: true,
  label: 'Group',
  color: OUTLINE_COLOR.NEUTRAL_2,
  subLevels: [
    ActivityType.Group,
    ActivityType.Article,
    ActivityType.Podcast,
    ActivityType.Event,
    ActivityType.GrowthOpportunity,
  ],
  ai: {
    definition: `
      Groups bucket Articles, Podcasts, Events, and Growth
      Opportunities into themed channels (e.g. "Engineering",
      "Community News"). A Group itself has no body content - it
      surfaces and orders the items inside it.`,
  },
};

const EVENT: ActivityConfig = {
  type: ActivityType.Event,
  rootLevel: true,
  label: 'Event',
  color: OUTLINE_COLOR.ACCENT_6,
  meta: [
    {
      key: 'link',
      type: MetaInputType.Textarea,
      label: 'Event Link',
      placeholder: 'Enter event link',
      validate: { url: true },
      rows: 1,
    },
    {
      key: 'participants',
      type: MetaInputType.Combobox,
      label: 'Participants',
      placeholder: 'Participants',
      multiple: true,
      options: [],
    },
    ...defaultMeta,
  ],
  ai: {
    definition: `
      An Event promotes a gathering: meetup, webinar, conference,
      workshop. Body copy is a short editorial blurb (what, when,
      who, why attend) - not a long article.`,
  },
};

const PODCAST: ActivityConfig = {
  type: ActivityType.Podcast,
  rootLevel: true,
  label: 'Podcast',
  color: OUTLINE_COLOR.ACCENT_3,
  meta: [
    ...podcastMeta,
    ...defaultMeta,
    {
      key: 'participants',
      type: MetaInputType.Combobox,
      label: 'Participants',
      placeholder: 'Participants',
      multiple: true,
      options: [],
    },
  ],
  ai: {
    definition: `
      A Podcast promotes an audio show: episode summary, hosts,
      and platform links. Body copy is an editorial summary,
      typically a paragraph or two - not a transcript.`,
  },
};

const GROWTH_OPPORTUNITY: ActivityConfig = {
  type: ActivityType.GrowthOpportunity,
  rootLevel: true,
  label: 'Growth Opportunity',
  meta: [...defaultMeta],
  color: OUTLINE_COLOR.ACCENT_5,
  contentContainers: [ActivityType.Section],
  ai: {
    definition: `
      A learning or career opportunity surfaced to the community
      (open role, scholarship, mentorship program, certification).
      Body copy is an editorial pitch: who it's for, what's
      offered, how to apply.`,
  },
};

const ARTICLE: ActivityConfig = {
  type: ActivityType.Article,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Article',
  meta: [
    ...defaultMeta,
    {
      key: 'authors',
      type: MetaInputType.Combobox,
      label: 'Authors',
      placeholder: 'Authors',
      multiple: true,
      options: [],
    },
  ],
  color: OUTLINE_COLOR.ACCENT_1,
  contentContainers: [ActivityType.Section],
  ai: {
    definition: `
      An Article is the long-form item in a feed: blog post, news
      piece, opinion. Editorial / journalistic voice; lead with
      what's interesting, attribute claims, vary rhythm.`,
  },
};

const SECTION: ContentContainerConfig = {
  type: ActivityType.Section,
  templateId: ContentContainerType.Default,
  label: 'Section',
  ai: {
    definition: 'Body copy for the parent feed entry.',
    outputRules: {
      prompt: `
        - Editorial / feed shape. The host activity decides the
          voice and length:
          - Article: long-form, journalistic. Lead with what's
            interesting, attribute claims, vary sentence rhythm.
          - Event: short editorial blurb (what / when / who /
            why attend). A few short paragraphs at most.
          - Podcast: short editorial summary of the show or
            episode (a paragraph or two), not a transcript.
          - Growth Opportunity: editorial pitch (who it's for,
            what's offered, how to apply). Concise.
        - No textbook framing or learning-objective scaffolding.`,
    },
  },
};

export const SCHEMA: Schema = {
  id: 'FEED_SCHEMA',
  name: 'Feed',
  description: 'A community feed with articles and growth opportunities.',
  workflowId: DEFAULT_WORKFLOW.id,
  ai: { contentMode: ContentMode.Editorial },
  structure: [GROUP, EVENT, ARTICLE, PODCAST, GROWTH_OPPORTUNITY],
  contentContainers: [SECTION],
};
