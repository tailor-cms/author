# Meta Input

## Introduction

Meta Inputs are simple data input components like text input, file input,
select input, etc. which can be attached by configuration to Repository,
Activity and Content Element entities.

## Installation and Management of Meta Inputs

Managing meta inputs within your project is straightforward with the 
provided CLI commands. Here's how you can view, install, and remove Meta
Inputs.

### Viewing Installed Meta Inputs

To list all installed Meta Inputs, use the following command:

```sh
pnpm mi ls
```

### Installing a new Meta Input
To add a new Meta Inputs to your project, execute:

```sh
pnpm mi i
```

Then, simply follow the on-screen instructions to complete the installation.

### Removing an Meta Input
If you need to remove an existing Meta Input, you can do so with:

```sh
pnpm mi rm
```

This command will prompt you to select an Meta Input from the list of 
currently installed items.

### Integrating the Meta Inputs

After installing or removing a Meta Input, you'll need to integrate
change into your project's schema. Each Meta Input is referenced by
unique `type` value, exposed by the Meta Input manifest. Make sure to
include the Meta Input `type` in the targeted schema entity config and
rebuild the codebase:

```sh
pnpm build
```

For detailed instructions on configuring Meta Inputs within your schema,
refer to the "Content Configuration" section.
