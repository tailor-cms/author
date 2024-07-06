# Content configuration

## Introduction

Within Tailor, we can define multiple Schemas, which serve as blueprints for 
Repository structures. Schemas are plain JavaScript objects that contain 
specifications for the repository's structure, including containers, elements, 
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
referred to as CE_HTML. 

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
  label: 'Entry',
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

## API

### `SCHEMAS`

An array of Schema objects.

#### Schema

- **id** `String` - Schema identifier.
- **name** `String` - Schema display name.
- **workflowId** `String` - [Workflow](#workflow) identifier.
- **meta** `Array<Metadata>` - An array of objects defining repository metadata.
- **structure** `Array<ActivityConfig>` - An array of objects which define
  schema structure.
- **contentContainers** `Array<ContentContainer>` - Array of content container
  configs.
- **elementMeta** `Array<ElementMetaConfig>` - An array of objects defining
  content element metadata.

#### ActivityConfig - Schema structure elements

Configuration for schema structure nodes (activities). Contains the following
properties:

- **type** `String` - Const for marking activity type.
- **rootLevel** `Boolean` - Used to define first level (root) activity types
- **subLevels** `Array<String>` - An array of sub-types.
- **label** `String` - Display label.
- **color** `String` - Display color in hexadecimal notation.
- **isTrackedInWorkflow** `Boolean` - Defines whether the workflow status will be tracked for this activity type.
- **contentContainers** `Array<String>` - Array of content container types that
  define which content containers can be added.
- **relationships** `Array<ActivityRelationship>` - Defines what relationships this
  activity has to other activities.
- **meta** `Array<Metadata>` - An array of objects defining activity metadata.

#### ActivityRelationship

Defines the structure of the activity relationship field.

- **type** `String` - Defines the name of the relationship. The relationship
  will be published under this value.
- **label** `String` - Display label.
- **placeholder** `String` - Display label for the select picker.
- **multiple** `Boolean` - Defines if the relationship can have multiple
  associations chosen. True by default.
- **searchable** `Boolean` - Defines if the list of activities can be searched.
  True by default.
- **allowEmpty** `Boolean` - Defines if the member list can be empty. True by
  default.
- **allowCircularLinks** `Boolean` - Defines if a member of the relationship
  instance can set the owner of that instance as a member of its own instance of
  that relationship. Example, activity X sets activity Y as its prerequisite. If
  `allowCircualLinks` is set to true then activity Y can set activity X as its
  prerequisite. False by default.
- **allowInsideLineage** `Boolean` - Defines if an ancestor or a descendant can
  be a member of the relationship. False by default.
- **allowedTypes** `Array<String>` - Defines activity types that can be associated in a relationship.

#### Metadata

Defines the structure of the activity metadata field.

- **key** `String` - Unique key for the field.
- **type** `String` - Type of the input component used on the client.
- **label** `String` - Display label.
- **placeholder** `String` - Input component placeholder.
- **validate** `MetadataValidator` - Validator object.
- **defaultValue** `*` - Default field value.

#### MetadataValidator

Defines validation rules on an activity metadata field.

- **rules** `Object` - Contains the following properties:
- max `Number` - Maximum character count.
- required `Boolean` - Defines if the field is required.

#### ContentContainer

Configuration for content containers. Contains the following properties:

- **type** `String` - `const-cased` string for marking `ContentContainer` type.
- **templateId** `String` - `const-cased` string that defines which custom
  `ContentContainer` is used to display this container. Needs to match the
  `templateId` property of the desired custom `ContentContainer`. If not
  specified the default `ContentContainer` is used to display this container.
- **label** `String` - String used for referencing `ContentContainer` on the UI.
- **multiple** `Boolean` - Defines if there can be multiple instances of the
  `ContentContainer` inside a single `Activity`. False by default.
- **types** `Array<String>` - An array of possible content element types that
  can exist inside a `ContentContainer`. If not specified all types of elements
  are allowed.
- **displayHeading** `Boolean` - Defines if a heading is displayed on top of the
  `ContentContainer`. False by default.
- **layout** `Boolean` - Defines if elements inside a `ContentContainer`
  instance can be placed two in a row. True by default.
- **config** `Object` - Defines `ContentContainer` specific properties.
- **required** `Boolean` - Defines if an instance of the `ContentContainer` is
  created if non exist. True by default.
- **publishedAs** `String` - Defines the name of the file under which the
  container will be published. Defaults to `container`. The name of the
  structure component used is the `kebab-cased` version of the `type` property.
  (example: ABC_DEF -> abc-def)

#### ElementMetaConfig

Defines the structure of an content element metadata.

- **type** `String` - Type of content element (example: "IMAGE", "HTML").
- **inputs** `Array<ElementMeta>` - Defines what meta fields content element has.
- **relationships** `Array<ElementRelationship>` - Defines what relationship
  metadata content element has (relationships with content elements from the same
  or other activities in the repository).

#### ElementRelationship

Defines the structure of an content element relationship field.

- **key** `String` - Defines the name of the relationship. The relationship
  will be published under this value.
- **label** `String` - Display label.
- **placeholder** `String` - Label for relationship add button and modal title.
- **multiple** `Boolean` - Defines if the relationship can have multiple
  associations chosen. True by default.
- **allowedTypes** `Array<String>` - Defines to what type of content elements
  given content element can have relationship with (example: `['VIDEO']`).

#### ElementMeta

Defines what meta fields content element has.

- **key** `String` - Unique key for the field.
- **type** `String` - Type of the input component used on the client.
- **label** `String` - Display label.
- **description** `String` - Description of meta field.
- **options** `Array<Object>` - Options for certain types of input component.
  For example, for select component, options would be:
  ```json
  "type": "SELECT"
  "options": [{
      "label": "First",
      "value": "first"
    }, {
      "label": "Second",
      "value": "second"
    }]
  ```
