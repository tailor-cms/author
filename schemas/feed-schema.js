import { DEFAULT_WORKFLOW } from './default-workflow';

const ACTIVITY_TYPE = {
  ARTICLE: 'ARTICLE',
  PODCAST: 'PODCAST',
  EVENT: 'EVENT',
  GROWTH_OPPORTUNITY: 'GROWTH_OPPORTUNITY',
  SECTION: 'SECTION',
  GROUP: 'GROUP',
};

const defaultMeta = [
  {
    key: 'description',
    type: 'HTML',
    label: 'Description',
  },
  {
    key: 'thumbnail',
    type: 'FILE',
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
    type: 'COMBOBOX',
    label: 'Tags',
    placeholder: 'Tags',
    multiple: true,
    options: [],
  },
];

const podcastMeta = [
  {
    key: 'spotifyLink',
    type: 'TEXTAREA',
    label: 'Spotify Link',
    placeholder: 'Enter a valid Spotify link',
    validate: { url: true },
    rows: 1,
  },
  {
    key: 'youtubeLink',
    type: 'TEXTAREA',
    label: 'YouTube Link',
    placeholder: 'Enter a valid YouTube link',
    validate: { url: true },
    rows: 1,
  },
  {
    key: 'applePodcastLink',
    type: 'TEXTAREA',
    label: 'Apple Podcast Link',
    placeholder: 'Enter a valid Apple Podcast link',
    validate: { url: true },
    rows: 1,
  },
];

const GROUP = {
  type: ACTIVITY_TYPE.GROUP,
  rootLevel: true,
  label: 'Group',
  color: '#5187C7',
  subLevels: [
    ACTIVITY_TYPE.GROUP,
    ACTIVITY_TYPE.ARTICLE,
    ACTIVITY_TYPE.PODCAST,
    ACTIVITY_TYPE.EVENT,
    ACTIVITY_TYPE.GROWTH_OPPORTUNITY,
  ],
  ai: {
    definition: `Groups are a way to organize content into categories.`,
  },
};

const EVENT = {
  type: ACTIVITY_TYPE.EVENT,
  rootLevel: true,
  label: 'Event',
  color: '#7986CB',
  meta: [
    {
      key: 'link',
      type: 'TEXTAREA',
      label: 'Event Link',
      placeholder: 'Enter event link',
      validate: { url: true },
      rows: 1,
    },
    {
      key: 'participants',
      type: 'COMBOBOX',
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

const PODCAST = {
  type: ACTIVITY_TYPE.PODCAST,
  rootLevel: true,
  label: 'Podcast',
  color: '#CDDC39',
  meta: [
    ...podcastMeta,
    ...defaultMeta,
    {
      key: 'participants',
      type: 'COMBOBOX',
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

const GROWTH_OPPORTUNITY = {
  type: ACTIVITY_TYPE.GROWTH_OPPORTUNITY,
  rootLevel: true,
  label: 'Growth Opportunity',
  meta: [...defaultMeta],
  color: '#08A9AD',
  contentContainers: [ACTIVITY_TYPE.SECTION],
  ai: {
    definition: 'Represents a learning opportunity for the community.',
  },
};

const ARTICLE = {
  type: ACTIVITY_TYPE.ARTICLE,
  rootLevel: true,
  isTrackedInWorkflow: true,
  label: 'Article',
  meta: [
    ...defaultMeta,
    {
      key: 'authors',
      type: 'COMBOBOX',
      label: 'Authors',
      placeholder: 'Authors',
      multiple: true,
      options: [],
    },
  ],
  color: '#08A9AD',
  contentContainers: [ACTIVITY_TYPE.SECTION],
  ai: {
    definition: 'Entry represents an article within a feed.',
  },
};

const SECTION = {
  type: ACTIVITY_TYPE.SECTION,
  templateId: 'DEFAULT',
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

export const SCHEMA = {
  id: 'FEED_SCHEMA',
  name: 'Feed',
  description: 'A community feed with articles and growth opportunities.',
  workflowId: DEFAULT_WORKFLOW.id,
  structure: [GROUP, EVENT, ARTICLE, PODCAST, GROWTH_OPPORTUNITY],
  contentContainers: [SECTION],
};
