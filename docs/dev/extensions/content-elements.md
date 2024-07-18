# Content Element Extensions

Content Elements serve as the foundational building blocks for creating
content within Tailor. They are essential components that allow for the
versatile creation and structuring of content.

## Examples of Content Elements

- **Rich Text Editor**: Enables the creation and editing of rich text content.
- **Video Content Element**: Facilitates the embedding and display of video 
  content.
- **Multiple Choice Question**: Allows for the creation of interactive
  multiple-choice questions.
 
## Components of Content Elements

Content Elements consist of two primary components:

1. **Authoring Component**: This is where the content creation process takes
   place. It's designed for content creators to input and structure their
   content.
2. **End-User/Rendering Component**: This component is responsible for
   displaying the content to the end-user in its final form.

## Development

For Content Element development, Tailor provides a **Content Element Kit**, 
which includes a separate runtime that emulates the Tailor environment.

For comprehensive details on the structure of Content Elements and the APIs 
available, please refer to the 
[Content Element Kit documentation](https://tailor-cms.github.io/xt). 

## Installation and Management of Content Elements

Managing content elements within your project is straightforward with the 
provided CLI commands. Here's how you can view, install, and remove Content 
Elements.

### Viewing Installed Elements

To list all installed Content Elements, use the following command:

```sh
pnpm ce ls
```

### Installing a New Element
To add a new Content Element to your project, execute:

```sh
pnpm ce i
```

Then, simply follow the on-screen instructions to complete the installation.

### Removing an Element
If you need to remove an existing Content Element, you can do so with:

```sh
pnpm ce rm
```

This command will prompt you to select an element from the list of currently
installed elements for removal.

### Integrating the Content Element
After installing or removing a Content Element, if your Content Container
enables the subset of installed Content Elements, you'll need to integrate
change into your project's schema. Each Content Element is referenced by
unique `type` value, exposed by the Content Element manifest. Make sure to
include the element `type` in the targeted schema Container config and
rebuild the codebase:

```sh
pnpm build
```

For detailed instructions on configuring content elements within your
Content Container, refer to the "Content Configuration" section.
