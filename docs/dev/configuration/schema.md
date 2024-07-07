# Adding new schema

`tailor.config.js` is required to export a `SCHEMAS` property, which contains
an array of Schemas available in the system. Currently, schemas are defined
using `js`, which we plan to migrate to `ts` in the future. Within the
documentation, we'll use TypeScript interfaces to document Schema configuration
options.

\
 `tailor.config.js`

```ts
export const SCHEMAS: Schema[] = [];
```

\
Let's dive a bit into Schema definition.

```ts
interface Schema {
  // Unique identifier of the schema
  // Upon creating a Repository, schema id will be stored on the
  // Repository entity, forcing the Repository to follow schema rules.
  id: string;
  // Label for the schema; e.g. Course, Knowledge Base, Textbook
  name: string;
  // Repository entity metadata configuration
  // Ability to specify additional data inputs for repository
  // These will be available within Repository Settings page
  // e.g. adding file input that enables uploading Repository poster img
  meta?: Metadata[];
  // Provides repository structure definition as Array of Activity node
  // configurations. If you are not familiar with concept of Activity
  // please revisit concepts section.
  structure: ActivityConfig[];
  // Provide configuration for Content Containers which are used within
  // this schema
  contentContainers: ContentContainer[];
  // Ability to specify additional data inputs for any installed element
  // Inputs are shown within editor sidebar upon element selection
  // For more details see content element metadata configuration
  elementMeta?: ElementMetaConfig[];
  // Needs to be provided to enable progress tracking via Workflow feature
  // Workflows enable authors to set progress for structure items
  // See workflow configuration section for more details
  workflowId?: string;
}
```

Here is an example of a minimalistic schema, where the structure is made up of
Pages containing Sections. The Repository outline is one level deep, meaning
entries cannot be nested or grouped.

```js
const SCHEMA = {
  id: 'PAGE_COLLECTION',
  name: 'Page collection',
  structure: [
    {
      type: 'PAGE',
      label: 'Page',
      color: '#08A9AD',
      contentContainers: ['SECTION'],
    },
  ],
  contentContainers: [
    {
      type: 'SECTION',
      templateId: 'DEFAULT',
      label: 'Section',
    },
  ],
};
```

and another one containing a slightly deeper structure with Modules acting
as top-level grouping nodes:

```js
const SCHEMA = {
  id: 'PAGE_COLLECTION',
  name: 'Page collection',
  structure: [
    {
      type: 'MODULE',
      label: 'Module',
      color: '#5187C7',
      subLevels: ['PAGE'],
    },
    {
      type: 'PAGE',
      label: 'Page',
      color: '#08A9AD',
      contentContainers: ['SECTION'],
    },
  ],
  contentContainers: [
    {
      type: 'SECTION',
      templateId: 'DEFAULT',
      label: 'Section',
    },
  ],
};
```
