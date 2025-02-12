# Content configuration

## Introduction

Within Tailor, Schemas act as blueprints for the Repository structure. 
Written in TypeScript, Schemas define the Repository's structure, including 
containers, elements, and metadata. These Schemas are part of the Tailor 
configuration package, located in the `./config` directory.

## Example

:::info
For those new to Tailor, it's recommended to familiarize yourself with
foundational concepts such as Activity or Content Container by exploring the
`Concepts` section.
:::

As an illustrative example, let's model a Knowledge Base schema. This Schema
is designed to organize content by Categories. Content is added to Page nodes,
which are contained within Categories. Each Entry can host multiple Section
Containers; Content Containers that hold the actual Content Elements. For
this scenario, we will add two groups of content elements to showcase different 
configuration possibilities. Third option is used for specifying allowed
embed elements.

Here is an example:

```ts
// This is a top level Activity which we named Category
// It is used only to group lower level Activities
const CATEGORY: ActivityConfig = {
  // Unique activity type in context of this repository
  type: 'CATEGORY',
  // Root nodes need to be flagged
  rootLevel: true,
  // Activity label
  label: 'Category',
  // Used within the UI for color coding this item
  color: '#5187C7',
  // Sub-activities which can be nested
  subLevels: ['PAGE'],
};

// This is a leaf Activity which we named Page
// It has content container attached to it, which makes it editable
const PAGE: ActivityConfig = {
  type: 'PAGE',
  label: 'Page',
  color: '#08A9AD',
  contentContainers: ['SECTION'],
};

// This is a Content Container definition.
// We are going to use 'DEFAULT' container which is provided with Tailor
// 'DEFAULT' container is just a list of Content Elements which are enabled
// by adding it to the `contentElementConfig` config
const SECTION: ContentContainerConfig = {
  // Content Container id for this particular schema
  type: 'SECTION',
  // id of the installed container
  templateId: 'DEFAULT',
  label: 'Section',
  // Configuration of Content Element types which Author can add to this 
  // container
  contentElementConfig: [
    {
      name: 'Group A',
      config: { isGradable: true },
      items: [ContentElementType.MultipleChoice]
    }, 
    {
      name: 'Group B',
      items: [
        ContentElementType.MultipleChoice,
        { id: ContentElementType.SingleChoice, isGradable: false },
      ]
    },
  ],
  // Configuration of Content Element types which Author can add as embedded
  // elements inside composite elements in this container
  embedElementConfig: [ContentElementType.TiptapHtml],
};

export const SCHEMA: Schema = {
  // Unique identifier of the schema
  id: 'MY_KNOWLEDGE_BASE',
  // Schema label
  name: 'Custom Knowledge Base',
  // List of activity configs which make up repository structure
  structure: [CATEGORY, PAGE],
  // Content container configuration
  contentContainers: [SECTION],
};
```

To integrate Schema into Tailor, add the codebase to e.g.
`/config/src/schemas/my-knowledge-base.ts` and then import it within 
`/config/src/index.ts` entrypoint. The entrypoint file exports an array
of all Schema definitions, enabling the creation of a Repository. Here is an
example of config entrypoint file exposing our newly created schema:

:::info
Tailor includes several predefined example schemas, so this file will
already contain some entries.
:::

```js
import { SCHEMA as MyKnowledgeBase } from './config/src/schemas/my-knowledge-base';
import { DEFAULT_WORKFLOW } from './config/src/workflows/default.workflow';

export const SCHEMAS = [MyKnowledgeBase];
export default {
  SCHEMAS,
  WORKFLOWS,
};
```

:::tip Rebuild!
Make sure you rebuild the Tailor codebase to have the schema visible in the
UI.
:::
