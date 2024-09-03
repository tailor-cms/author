# Content Container Extensions

## Introduction

Content Containers are designed to organize and structure content by hosting 
Content Elements. They enable flexible arrangements for a variety of 
presentations, from simple lists to complex groupings with intricate 
logic, thereby improving content organization and presentation.

This section covers the basics for configuring and creating content containers, 
from simple examples to more advanced scenarios with sub-containers. 

By default, Tailor includes a `DEFAULT` container, a straightforward list of 
Content Elements which can be reused and configured in different ways e.g:

- It can have a different type to define different semantics (a Course
  page might have Learner specific content and Teacher specific content, 
  implemented using the same DEFAULT container, by specifying that Page 
  has two containers of different type using the same container component; 
  For more on this, see configuration section.
- There can be multiple containers of same type in the same page.
- One might define specific Content Element types which are enabled for
  specific container

## Content Container configuration options

The following configuration options are used for configuring Content
Container component:
 
**`templateId: string`**: const-cased string that defines which Content 
Container component is used. Needs to match the templateId property 
of one of the installed Content Container packages. If not specified
the DEFAULT container is used.

**`type: string`**: const-cased string which uniquely references Content
Container configuration (there can be a single unique Content Container 
definition per schema). Type property is stored on Activity entity 
(which is used to store the Container; remember that the Content Containers
are special Activity types). Type should match the semantics of the
container; e.g. lets say we want to use DEFAULT container to create two
different types of containers using the same Content Container component 
(same templateId). We might want to create a SECTION Container containing HTML 
Content Elements and QUESTION_POOL Container containing only MULTIPLE_CHOICE
Content Elements. By using content container configuration we have
flexibility to use same visual component in a different ways and assign
different semantics.

**`label: string`**: used for labeling the Container within the UI;
e.g. add container button, delete container button, etc.

**`displayHeading: boolean`**: Defines if a heading is displayed on top 
of the Container UI. False by default.

**`required: boolean`** - Defines if an instance of the Container is
created if non exist. True by default.

**`multiple: boolean`**: Defines if there can be multiple instances of the
Container inside a single Activity; e.g. multiple SECTION containers
within PAGE Activity. False by default.

**`types: Array<string>`**: An array of possible content element types that
can exist inside a Container. If not specified, all installed elements
are available.

**`publishedAs: string`** - Defines the name of the file under which the
container will be published. Defaults to container. The name of the
structure component used is the kebab-cased version of the type property.
(example: ABC_DEF -> abc-def)

**`layout: boolean`** - Defines if elements inside a Container
instance listing can be placed two in a row. True by default.

**`config: Object`**: Defines Custom Container specific properties

:::tip 👆 Important
Ensure you distinguish between distinct Custom Containers and Containers 
which are configured differently, such as those with different labels or 
allowed element types.
:::

## Creating a custom Content Container

### Introduction

The default container only allows minimum configuration that does 
not significantly impact presentation (list of elements), nor does it 
allow setting additional meta-information. Custom Content Containers are 
Tailor’s way of allowing such functionality.

If there is a need for one of the following requirements, we use custom
containers:

  - custom presentation of the basic list (either showing the list in a different 
  way or allowing additional information to be set),
  - more complex grouping of content elements (multiple lists grouped together, 
    branching logic, subcontainers, etc.).

### Entry file

Fundamentally Content Containers are packages exposing:

- `Edit` component (Vue 3), which is used to render Content Container in
  the authoring environment
- `templateId` property, which is a unique const-cased string used
  to identify Content Container component within the schema
- `version` property

```js
export default {
  templateId: 'DEFAULT',
  Edit,
  version: '1.0'
};
```

Content Contaners need to be developed within Tailor, to enable the reuse
of various core components and to have Content Elements available.

Content Container packages should be placed in the 
`packages/core-extensions/content-containers` directory. For initializing
the structure, utilize our [template](https://github.com/ExtensionEngine/tailor-container-template). Note that the template only sets up a basic
file structure; you will need to initialize the package manually.

### Example

TBD. See packages/core-extensions/content-containers/page for a 
current reference.

## Installation and Management of Content Containers

Managing content containers within your project is straightforward with the 
provided CLI commands. Here's how you can view, install, and remove Content 
Containers.

### Viewing Installed Containers

To list all installed Content Containers, use the following command:

```sh
pnpm cc ls
```

### Installing a New Containers
To add a new Content Container to your project, execute:

```sh
pnpm cc i
```

Then, simply follow the on-screen instructions to complete the installation.

### Removing an Containers
If you need to remove an existing Content Container, you can do so with:

```sh
pnpm cc rm
```

This command will prompt you to select an container from the list of currently
installed Containers for removal.

### Integrating the Content Containers

After installing or removing a Content Container, you'll need to integrate
change into your project's schema. Each Content Container is referenced by
unique `templateId` value, exposed by the Content Container manifest. Make sure to
include the container `templateId` in the targeted schema config and
rebuild the codebase:

```sh
pnpm build
```

For detailed instructions on configuring content containers, refer to the 
"Content Configuration" section.
