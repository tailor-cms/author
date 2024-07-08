# Content configuration

## Introduction

Within Tailor, we can define multiple Schemas, which serve as blueprints for
Repository structures. Schemas are plain JavaScript objects that contain
specifications for the Repository's structure, including containers, elements,
and various metadata.

The repository structure can be customized through the Tailor configuration file.
This file should be located in the root directory and named `tailor.config.js`.
It acts as an entry point, linking to individual schemas located within the
`/schemas` directory.

## Example

:::info
For those new to Tailor, it's recommended to familiarize yourself with
foundational concepts such as Activity or Content Container by exploring the
`Concepts` section.
:::

As an illustrative example, let's model a Knowledge Base schema. This schema
is designed to organize content by Categories. Content is added to Page nodes,
which are contained within Categories. Each Entry can host multiple Section
Containers; Content Containers that hold the actual Content Elements. For
this scenario, we will enable a single element: a WYSIWYG rich text editor,
referred to as CE_HTML_DEFAULT.

Here is an example:

```js
// This is a top level Activity which we named Category
// It is used only to group lower level Activities
const CATEGORY = {
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
const PAGE = {
  type: 'PAGE',
  label: 'Page',
  color: '#08A9AD',
  contentContainers: ['SECTION'],
};

// This is a Content Container definition.
// We are going to use 'DEFAULT' container which is provided with Tailor
// 'DEFAULT' container is just a list of Content Elements which are enabled
// by adding it to the `types` list
const SECTION = {
  // Content Container id for this particular schema
  type: 'SECTION',
  // id of the installed container
  templateId: 'DEFAULT',
  label: 'Section',
  // List of Content Element types which Author can add to this container
  types: ['CE_HTML_DEFAULT'],
};

export const SCHEMA = {
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

To integrate this schema into Tailor, add the codebase to e.g.
`/schemas/my-knowledge-base.js` and then import it within `tailor.config.js`.
The `tailor.config.js` file exports an array of all schema definitions,
enabling the creation of a repository. Here is an example of `tailor.config.js`
exposing our newly created schema:

:::info
Tailor includes several predefined example schemas, so this file will
already contain some entries.
:::

```js
import { SCHEMA as MyKnowledgeBase } from './schemas/my-knowledge-base';
import { DEFAULT_WORKFLOW } from './schemas/default-workflow';

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
