# Structure configuration

This section explains how to configure the repository structure. It covers
configuring Activities that can be Authored, setting up their relationships,
and defining the content each Activity will contain. If you are not familiar
with the concept of Activity, please revisit the Concepts section to get
yourself up to speed.

\
Let's start with a schema from the previous chapter which defines a single
structural Activity, a Page:

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

As noted in the Schema interface, structure property is a collection of
ActivityConfigs, where ActivityConfig has following properties:

```ts
interface ActivityConfig {
  // Const for defining the Activity type.
  // Example: MODULE, PAGE, TOPIC...
  type: string;
  // Display label used to present this Activity type within the UI
  // Example Module, Page, Topic...
  label: string;
  // Display color used to color code this Activity type; in hex format.
  // #00AABB
  color: string;
  // Flag used to define first level (root) activity types
  rootLevel?: boolean;
  // Defines children Activitiy types, e.g. for MODULE activity containing
  // PAGE activities subLevels: ['PAGE']
  subLevels?: string[];
  // Array of Content Container types that define which Content Containers
  // can be added. Content Containers are layout elements for Content
  // Elements making them essential for adding Content Elements within
  // the particular Activity. If Content Container is not attached, it is
  // common to use  Activity as Grouping node (but there are other purposes
  // as well). For more details see Content Container configuration
  // section.
  contentContainers?: string[];
  // Defines what relationships this activity has to other activities.
  // Relationships are generic concept and you can define as many as you
  // like. One example would be the ability to specify prerequisite
  // activities.
  relationships?: ActivityRelationship[];
  // By default, Author can specify only a name for an Activity. Metadata
  // concept like for Repository enables a way to add data inputs
  // to specific Activity type to collect additional information about
  // the Activity e.g. we might add description textfield to MODULE
  // Activity. For more details, see Activity Metadata configuration
  // section.
  meta?: Metadata[];
  // Enables progress tracking via the Workflow feature, for more details
  // see Workflow configuration section
  isTrackedInWorkflow?: boolean;
  // Provides additional context for the AI upon use for content generation
  ai?: AiActivityConfig;
}
```

Let's extend the schema from the previous example by adding a Module
activity. The purpose of the Module activity is to group pages, thus not
having a Content Container attached. Here is how we would do it:

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

We've configured the `MODULE` Activity and designated the `PAGE` Activity
as a sub-level of `MODULE`. It's important to note that Activities can be
recursive. This means if we wish to allow the addition of a `MODULE`
within another `MODULE` (essentially enabling sub-modules), we can easily
achieve this by adjusting the configuration:

```js
const SCHEMA = {
  id: 'PAGE_COLLECTION',
  name: 'Page collection',
  structure: [
    {
      type: 'MODULE',
      label: 'Module',
      color: '#5187C7',
      subLevels: ['MODULE', 'PAGE'],
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

## Activity Metadata

Upon creating our structural nodes, as configured in the previous example,
an Author can only specify a name (e.g., the name of the Module). However,
what if we want to collect additional data such as a description, the
estimated duration it might take for someone to complete the Module, and
a thumbnail image we want to show?

That's where Meta Inputs come into play. Meta inputs can be attached to
Repository, Activity, or Content Element entities. They are simple components
like text input, select picker, color picker, file upload. Meta Inputs allow
us to describe these entities without additional coding (by configuration).
As with Content Elements, these are pluggable into the platform, so new ones
can be developed and installed, providing additional flexibility.

Here is the base interface for the Meta Input:

```ts
interface MetaInput {
  // Type of meta input to use, e.g. textarea
  type: string;
  // Key name useed for data storage
  key: string;
  // Validation rules
  validate: Record<string, any>;
  defaultValue?: any;
}
```

Where each specific `MetaInput` type extends this interface with its specifics. 
Let's add a description input to our Module config from the previous example:

```js
const SCHEMA = {
  id: 'PAGE_COLLECTION',
  name: 'Page collection',
  structure: [
    {
      type: 'MODULE',
      label: 'Module',
      color: '#5187C7',
      meta: {
        key: 'description',
        type: 'TEXTAREA',
        label: 'Description',
        placeholder: 'Enter description...',
      },
      subLevels: ['MODULE', 'PAGE'],
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

## Activity relationships

We mentioned earlier Activity relationships. Relationships are generic
concept which can be used to define additional relationships between
structural Activities (in addition to parent-child structural relationships).

```ts
interface ActivityRelationship {
  // Defines key used for storing the relationship on the Activity entity.
  // The relationship will be published under this value.
  type: string;
  // relationship input UI label
  label: string;
  // relationship input UI placeholder
  placeholder: string;
  // Can multiple Activities be selected?
  multiple: boolean;
  // Can user search Activities upon selection?
  searchable: boolean;
  // Defines activity types that can be associated in a relationship
  allowedTypes: string[];
  // Defines if the member list can be empty
  allowEmpty: boolean;
  // Example, activity X sets activity Y as its prerequisite. If
  // allowCircualLinks is set to true then activity Y can set activity X as
  // its prerequisite. False by default.
  allowCircularLinks: boolean;
  // Can Activity reference its parents and children
  allowInsideLineage: boolean;
}
```

To enhance our schema, we'll introduce a "prerequisite" relationship. This
allows us to designate multiple Pages as prerequisites for any given Page:

```js
const SCHEMA = {
  id: 'PAGE_COLLECTION',
  name: 'Page collection',
  structure: [
    {
      type: 'MODULE',
      label: 'Module',
      color: '#5187C7',
      subLevels: ['MODULE', 'PAGE'],
    },
    {
      type: 'PAGE',
      label: 'Page',
      color: '#08A9AD',
      contentContainers: ['SECTION'],
      relationships: [
        {
          type: 'prerequisites',
          label: 'Prerequisites',
          placeholder: 'Click to select',
          multiple: true,
          searchable: true,
          allowEmpty: true,
          allowCircularLinks: false,
          allowInsideLineage: true,
          allowedTypes: ['PAGE'],
        },
      ],
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
