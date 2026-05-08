# Content Containers

Editor and server packages for the built-in content containers. Each
container ships an editor package (the Vue authoring component) and,
where it has server-side behaviour, a matching `*-server` package.

### Built-in containers

- **Page** - `templateId: DEFAULT`
  Plain ordered list of content elements.
  *Packages:* `page`

- **Structured Content** - `templateId: STRUCTURED_CONTENT`
  Typed subcontainers (see [below](#structured-content-container)).
  *Packages:* `structured-content`, `structured-content-server`

- **Exam** - `templateId: EXAM`
  Exam groups + question elements.
  *Packages:* `exam-edit`, `exam-server`

- **Assessment Pool** - `templateId: ASSESSMENT_POOL`
  Pool of reusable assessment items.
  *Packages:* `assessment-pool-edit`, `assessment-pool-server`

### Wiring a container into a schema

Reference the `templateId` from a `ContentContainerConfig` entry under
an outline activity's `contentContainers` field. Developers can extend
this set by publishing new packages that follow the same shape.
hooks).

## Structured Content container

Holds an ordered list of typed *subcontainers*, each with its own
label, icon, meta fields, and allowed content element set.
Subcontainers are activities (children of the container activity) and
contain the actual content elements.

### Registering

The example below exercises every supported field. Most are optional -
a minimal container only needs `templateId`, `type`, `label`, and at
least one subcontainer-type definition under `config`.

```ts
import { ContentContainerType } from '@tailor-cms/interfaces/schema';
import { ContentElementType, MetaInputType } from '@/your/enums';

const SectionContainer: ContentContainerConfig = {
  templateId: ContentContainerType.StructuredContent,
  type: 'SECTION_CONTAINER',
  label: 'Sections',
  // Container is auto-created with the parent activity.
  required: true,
  // Hide the activity-level heading.
  displayHeading: false,
  // Only one container of this type per parent.
  multiple: false,
  // Container-wide fallback for subcontainer types that don't define
  // their own contentElementConfig.
  contentElementConfig: [
    {
      name: 'Content Elements',
      items: [ContentElementType.TiptapHtml, ContentElementType.Image],
    },
  ],
  // Optional ai config
  ai: {
    definition: 'A learning section with mixed media and assessments.',
    outputRules: { prompt: 'Keep section bodies under 200 words.' },
  },
  config: {
    // Collapse/expand per subcontainer.
    isCollapsible: true,
    // Which data field shows in the collapsed header.
    collapsedPreviewKey: 'title',
    // Seeded on first mount; also pins AI output to this exact set.
    defaultSubcontainers: [
      { type: 'SECTION', data: { title: 'Intro' } },
      { type: 'SECTION', data: { title: 'Key Concepts' } },
      { type: 'SUMMARY', data: { title: 'Wrap-up' } },
    ],
    // Subcontainer config
    SECTION: {
      label: 'Section',
      icon: 'mdi-text-box-outline',
      meta: (repository, outlineActivity, container) => [
        {
          key: 'title',
          type: MetaInputType.Input,
          label: 'Title',
          validate: { rules: 'required|min:3' },
        },
      ],
      initMeta: () => ({ title: 'New section' }),
      contentElementConfig: [
        {
          name: 'Content Elements',
          items: [
            ContentElementType.TiptapHtml,
            ContentElementType.Image,
            ContentElementType.Video,
          ],
        },
        {
          name: 'Assessments',
          config: { isGradable: true },
          items: [
            ContentElementType.MultipleChoice,
            ContentElementType.SingleChoice,
          ],
        },
      ],
    },
  },
};
```

The `config` block mixes two kinds of keys:

- **Container-level options** (`isCollapsible`, `collapsedPreviewKey`,
  `defaultSubcontainers`) - apply to the container as a whole.
- **Subcontainer-type definitions** - any other key is treated as a
  subcontainer activity type. The key must match an `ActivityType`
  that is allowed as a child of this container in the schema.

### Container-level options

#### `isCollapsible: boolean`
Default: `false`.

Renders each subcontainer with a chevron toggle and a clickable header
that collapses/expands its body. When collapsed, the header shows a
preview text (see `collapsedPreviewKey`) and an element-count chip.

When `true` and there is more than one subcontainer, an "Expand all /
Collapse all" button is added to the container toolbar.

#### `collapsedPreviewKey: string | null`
Default: `null` (falls back to the first meta field's `key`).

Which field of `subcontainer.data` to render in the collapsed header.
Typically the title field of the meta schema.

#### `defaultSubcontainers: Array<{ type, data }>`
Default: `[]`.

Subcontainers to seed when the container is first opened with no
children. On mount, if the container has zero subcontainers, one
`add:subcontainer` is emitted per entry, in order. `data` is merged on
top of the type's `initMeta()` output.

This option also constrains AI generation: when defaults are defined,
the OpenAI structured-output schema is adapted.

### Subcontainer-type definitions

Each non-option key in `config` defines a subcontainer type. All
fields below are optional.

**Identity**

- `label: string`
  Display label. Defaults to a humanised version of the key.
- `icon: string`
  Material Design icon name. Defaults to `mdi-text`.

**Meta schema**

- `meta: (repository, outlineActivity, container, val) => MetaField[]`
  Meta input schema for the subcontainer's `data`.
- `initMeta: (repository, outlineActivity, container, val) => object`
  Initial `data` values applied when the subcontainer is created.

**Content elements**

- `contentElementConfig: ElementConfig[]`
  Allowed content elements (groups + items). Falls back to the
  container's top-level `contentElementConfig` when omitted.
- `disableContentElementList: boolean`
  Hide the inner content-element list. Use for meta-only subcontainers.

**AI**

- `disableAi: boolean`
  Exclude this type from AI generation.
