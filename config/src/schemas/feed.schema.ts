import {
  ActivityConfig,
  ContentContainer,
  Metadata,
  Schema,
} from '@tailor-cms/interfaces/schema';
import { ContentContainerType } from '@tailor-cms/content-container-collection/types.js';
import { MetaInputType } from '@tailor-cms/meta-element-collection/types.js';

import { DEFAULT_WORKFLOW } from '../workflows/default.workflow';

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
    placeholder: 'Click to upload a thumbnail image',
    icon: 'mdi-image',
    validate: {
      ext: ['jpg', 'jpeg', 'png'],
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
  color: '#5187C7',
  subLevels: [
    ActivityType.Group,
    ActivityType.Article,
    ActivityType.Podcast,
    ActivityType.Event,
    ActivityType.GrowthOpportunity,
  ],
  ai: {
    definition: `Groups are a way to organize content into categories.`,
  },
};

const EVENT: ActivityConfig = {
  type: ActivityType.Event,
  rootLevel: true,
  label: 'Event',
  color: '#7986CB',
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
    definition: 'Events are a way to promote gatherings.',
  },
};

const PODCAST: ActivityConfig = {
  type: ActivityType.Podcast,
  rootLevel: true,
  label: 'Podcast',
  color: '#CDDC39',
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
    definition:
      'Provides a way to promote podcasts on various platforms and view aggregated engagement data.',
  },
};

const GROWTH_OPPORTUNITY: ActivityConfig = {
  type: ActivityType.GrowthOpportunity,
  rootLevel: true,
  label: 'Growth Opportunity',
  meta: [...defaultMeta],
  color: '#08A9AD',
  contentContainers: [ActivityType.Section],
  ai: {
    definition: 'Represents a learning opportunity for the community.',
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
  color: '#08A9AD',
  contentContainers: [ActivityType.Section],
  ai: {
    definition: 'Entry represents an article within a feed.',
  },
};

const SECTION: ContentContainer = {
  type: ActivityType.Section,
  templateId: ContentContainerType.Default,
  label: 'Section',
  ai: {
    definition: 'Page content is organized into sections.',
    outputRules: {
      prompt: `
        - Split the content contextually to couple of { "content": "" } blocks
          based on the context. Headings might be a good place to split.
          Dont include more than 3 headings.
        - Try to use at least 2000 words and don't exceed 4000 words.
        - Format the content as a HTML with suitable tags and headings.
        - Apply the folllowing classes to the tags:
          - Apply text-body-2 mb-5 to the paragraphs
          - Apply text-h3 and mb-7 to the headings
        You are trying to teach the audience, so make sure the content is easy to
        understand, has a friendly tone and is engaging to the reader.
        Make sure to include the latest relevant information on the topic.`,
      useDalle: true,
    },
  },
};

export const SCHEMA: Schema = {
  id: 'FEED_SCHEMA',
  name: 'Feed',
  description: 'A community feed with articles and growth opportunities.',
  workflowId: DEFAULT_WORKFLOW.id,
  structure: [GROUP, EVENT, ARTICLE, PODCAST, GROWTH_OPPORTUNITY],
  contentContainers: [SECTION],
};
