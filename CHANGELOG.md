# Changelog

## v8.0.1

#### Changes
- Decoupled the automatic execution of database migrations from the `NODE_ENV`
  flag. This behavior is now controlled by the 
  `DATABASE_DISABLE_MIGRATIONS_ON_STARTUP` flag.
- Added the ability to build a Docker image when running `pulumi up`,
  eliminating the need to provide an image URL.

## v8.0

#### Changes
- Migrated Accordion, Audio, Brightcove Video, Carousel, Drag & Drop, Embed, 
  Fill in Blank, Jodit HTML, Matching Question, Modal, Numerical Response, Page 
  Break, PDF, Quill HTML, Single Choice, True-False, Table, Text Response and 
  Video content elements
- Migrated Assessment Pool and Exam content containers.
- Migrated Checkbox, Combobox, DateTime, Select, Switch and Text Field meta 
  inputs.
- Migrated Embedded Container, Tailor Dialog core components. Also migrated 
  Question Container core component and updated all question content elements to 
  reuse the component.
- Migrated OIDC. As part of the migration, prefixed `OIDC_ENABLED`, 
  `OIDC_LOGIN_TEXT` and `OIDC_LOGOUT_ENABLED` environment variables with 
  `NUXT_PUBLIC_`. Also prefixed `SESSION_SECRET` with `OIDC_`. 
  See `.env.example` for more details.
- Migrated `config-parser` and `utils` packages to TypeScript.
- Migrated schemas to `@tailor-cms/config` package, located in the `./config`
  dir. Schemas are now defined using the TypeScript.
- Migrated the option to link activities. The old structure, which only 
  contained an ID, has been updated to an object containing both `id` and 
  `entity` type. Specifically, `objectiveId: ID` has been replaced with 
  `objective: { id: ID, entity: 'Activity' }`. This change enables 
  differentiation between entities when detecting broken references. If no 
  `entity` property is provided, it is assumed to belong to the same entity as 
  the target element. Additionally, a transformation to revert to the old format 
  before publishing has been added to prevent migrations on consumer platforms.
- Refactored publishing by breaking the logic into multiple modules, adding 
  LocalStack to `compose.dev` and enabling S3 endpoint configuration.
- Refactored Questions to separate question form from the container. Question 
  content elements are just importing the form inside the container. This
  provides users with greater flexibility to extend functionality.
- Refactored the export repository flow. The setup initiates the job and returns 
  a `jobId`. The client calls the server periodically to get the job status. 
  Once it is done, the ready status is set and the user can download it.
- Improved AI outline generation by ensuring proper order, disabling creation 
  when assistance is provided and updating the AI model.
- Added AI user prompt for adding and modifying default container content, also
  added generic interface for repository context and AI interaction.
- Enhanced the Activity API with request validation and additional access checks.
- Enhanced the Revision API with request validation and a repository ownership
  check for revisions.
- Improved the Dockerfile by updating the base image, pruning the build, and 
  running the initialization process via dumb-init.
- Updated the compose spec. The dev spec has been revised to avoid naming 
  collisions and a workflow job has been added to test the default spec.
- Expanded the test suite to include tests for discussion, publishing, user 
  groups, copying and linking elements.
- Upgraded all dependencies to their latest versions including ESLint to v9.
- Replaced bunyan with pino logger.
- Replaced auto-publishing upon activity deletion with explicit publish.
- Passed environmental variables prefixed with `NUXT_` as cookies.
- Replaced the `types` property in the `contentContainer` schema with 
  `contentElementConfig`. This new property allows defining an array of 
  categories with supported content elements. As a result, the `categories` 
  property has been removed. The new property accepts either an array of content 
  element IDs or an array of categories. Categories are defined as objects with 
  a `name` containing the category name, `items`, which is a list of content 
  elements that the category contains and optionally `config` which contains 
  category level config which is applied to all content elements inside the 
  category. Aside from passing content element IDs, we can also pass an object 
  with `id` and any additional configuration for the given content element, such 
  as the `isGradable` property for questions. This applies to both lists inside
  the category and when defining `contentElementConfig` as a list of elements. 
  Examples of allowed values: 
  ```
  ['CE_EXAMPLE']`
  [{ id: 'CE_EXAMPLE', isGradable: true }]`
  [{ name: 'Category', items: ['CE_EXAMPLE'] }]`
  [{ name: 'Category', config: { isGradable: true }, items: ['CE_EXAMPLE'] }]`
  [{ name: 'Category', items: [{ id: 'CE_EXAMPLE', isGradable: true }] }]
  ``
- Added `embedElementConfig` to the `contentContainer` schema. This property 
  defines which content elements can be used as embedded elements inside 
  composite elements. It has the same syntax as `contentElementConfig`.
- Implemented a basic error page.
- Implemented User Groups and User Group access management.
- Implemented reviewable HE@S meta inputs.
- Implemented structured content container and initialized HA@S schema.
- Added support for activity guidelines. Guidelines are defined through the 
  schema as functions that accept a repository, containers, elements and the 
  content element registry and return an array of guidelines to guide authors 
  through course creation.
- Added the ability to display Content Element version info on hover
- Added the ability to drag and drop outline items between different parent 
  elements.
- Added support to publish into the draft environment.
- Enabled TypeScript on the backend via the Node.js experimental flag.
- Added broken references detection. A warning is displayed in the structure 
  view if a broken element or activity reference is detected. Users can then 
  click a button to clean up broken references or manually update the linked 
  element/activity reference.
- Added schema descriptions, which are displayed in the schema list selector 
  when creating a new course. This is added via the `description` schema 
  property.
- Added the `COLLABORATOR` user role, which can create new repositories but does 
  not have access to all repositories. The old `USER` role has been migrated to 
  `COLLABORATOR`.
- Implemented Feed Schema.
- Implemented HA@S Rating meta input. This meta input allows inputting and 
  displaying ratings for the following parameters: Learner-Centered Content, 
  Active Learning, Unbounded Inclusion, Community Connections and Real-World 
  Outcomes.
- Added support for feature flags and session tracking using Statsig. To enable 
  this, the `NUXT_PUBLIC_STATSIG_KEY` environmental variable should be provided.


## v7.0

#### Changes
- Added the ability to turn off rate limiting via the `ENABLE_RATE_LIMITING`
  environment variable. See `.env.example` for more details.
- Updated Key-Value store configuration. See `.env.example` for more details.
- Updated healthcheck route to `/api/healthcheck`
- Increased E2E functional test coverage.
- Added E2E accessibility tests.
- Added a check to prevent publishing detached pages.
- Passed referenced elements to the target content element.
- Migrated Workflow, Admin Panel, Content Element Revision, Publish Diff, 
  Activity Copy, Element Copy, SSE, User Activity Reporting and User Profile.
