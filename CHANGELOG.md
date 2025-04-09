# Changelog

## v8.0

#### Changes
- Migrated Table, Brightcove Video, Jodit HTML and Quill HTML content elements.
- Migrated Exam and Assessment Pool content containers.
- Migrated Text Field meta input.
- Refactored Questions to separate question form from the container. Question 
  content elements are just importing the form inside the container. This
  provides users with greater flexibility to extend functionality.
- Implemented User Groups and User Group access management.
- Expanded the test suite to include tests for discussion, publishing, user 
  groups, copying and linking elements.
- Upgraded all dependencies to their latest versions.
- Updated the compose spec. The dev spec has been revised to avoid naming 
  collisions and a workflow job has been added to test the default spec.
- Improved the Dockerfile by updating the base image, pruning the build, and 
  running the initialization process via dumb-init.
- Enhanced the Activity API with request validation and additional access checks.
- Improved the Revision API with request validation and a repository ownership
  check for revisions.
- Added the ability to drag and drop outline items between different parent 
  elements.
- Migrated the option to link activities. The old structure, which only 
  contained an ID, has been updated to an object containing both `id` and 
  `entity` type. Specifically, `objectiveId: ID` has been replaced with 
  `objective: { id: ID, entity: 'Activity' }`. This change enables 
  differentiation between entities when detecting broken references. If no 
  `entity` property is provided, it is assumed to belong to the same entity as 
  the target element. Additionally, a transformation to revert to the old format 
  before publishing has been added to prevent migrations on consumer platforms.
- Implemented a basic error page.

## v7.2

#### Changes
- Replaced bunyan with pino logger.
- Migrated Accordion, Carousel and Modal content elements.
- Migrated Embedded Container core component.
- Refactored publishing by breaking the logic into multiple modules, adding 
  LocalStack to `compose.dev` and enabling S3 endpoint configuration.
- Added support to publish into the draft environment.
- Enabled TypeScript on the backend via the Node.js experimental flag.
- Implemented reviewable HE@S meta inputs.
- Implemented structured content container and initialized HA@S schema.
- Migrated Question Container core component and updated all question 
  content elements to reuse the component.
- Added support for activity guidelines. Guidelines are defined through the 
  schema as functions that accept a repository, containers, elements and the 
  content element registry and return an array of guidelines to guide authors 
  through course creation.
- Upgraded all dependencies to their latest versions, including ESLint to v9.
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

## v7.1

#### Changes
- Migrated Single Choice, Matching Question, True-False, Text Response, Drag & 
  Drop, Embed, Fill in Blank, Numerical Response, Page Break, PDF, Audio and 
  Video content elements.
- Migrated DateTime, Select, Combobox, Switch and Checkbox meta inputs.
- Migrated schemas to `@tailor-cms/config` package, located in the `./config`
  dir. Schemas are now defined using the TypeScript.
- Migrated Tailor Dialog core component and reused it where applicable.
- Migrated `config-parser` and `utils` packages to TypeScript.
- Migrated OIDC. As part of the migration, prefixed `OIDC_ENABLED`, 
  `OIDC_LOGIN_TEXT` and `OIDC_LOGOUT_ENABLED` environment variables with 
  `NUXT_PUBLIC_`. Also prefixed `SESSION_SECRET` with `OIDC_`. 
  See `.env.example` for more details.
- Added broken references detection. A warning is displayed in the structure 
  view if a broken element or activity reference is detected. Users can then 
  click a button to clean up broken references or manually update the linked 
  element/activity reference.
- Passed environmental variables prefixed with `NUXT_` as cookies.
- Implemented Feed Schema.
- Implemented HA@S Rating meta input. This meta input allows inputting and 
  displaying ratings for the following parameters: Learner-Centered Content, 
  Active Learning, Unbounded Inclusion, Community Connections and Real-World 
  Outcomes.
- Added support for feature flags and session tracking using Statsig. To enable 
  this, the `NUXT_PUBLIC_STATSIG_KEY` environmental variable should be provided.
- Improved AI outline generation by ensuring proper order, disabling creation 
  when assistance is provided and updating the AI model.
- Added schema descriptions, which are displayed in the schema list selector 
  when creating a new course. This is added via the `description` schema 
  property.
- Added the `COLLABORATOR` user role, which can create new repositories but does 
  not have access to all repositories. The old `USER` role has been migrated to 
  `COLLABORATOR`.
- Refactored the export repository flow. The setup initiates the job and returns 
  a `jobId`. The client calls the server periodically to get the job status. 
  Once it is done, the ready status is set and the user can download it.

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
