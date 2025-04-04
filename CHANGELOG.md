# Changelog

## v7.5

#### Changes
- Migrated Table, Brightcove Video, Jodit HTML, and Quill HTML content elements.
- Migrated Exam and Assessment Pool content containers.
- Migrated Text Field meta input.
- Migrated Table, Brightcove Video, Jodit HTML and Quill HTML content elements
- Migrated Exam and Assessment Pool content containers
- Migrated Text field meta input
- Refactored Questions to separate question form from the container. Question 
  content elements are just importing the form inside the container. This
   provides users with greater flexibility to extend functionality.
- Implemented User Groups and User Group access management.
- Expanded the test suite to include tests for discussion, publishing, user 
  groups, copying and linking elements.
- Upgraded all dependencies to their latest versions.
- Updated the compose spec. The dev spec has been revised to avoid naming 
  collisions, and a workflow job has been added to test the default spec.
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
- Added support for activity guidelines. Guidelines are defined through the 
  schema, they are functions which accepts repository, containers, elements and
  content element registry and return array of guidelines used to guide the
  author through the course creation.
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
- Migrated schemas to `@tailor-cms/config` package, located in the `./config`
  dir. Schemas are now defined using the TypeScript.

## v7.0

#### Changes
- Added the ability to turn off rate limiting via the `ENABLE_RATE_LIMITING`
  environment variable. See `.env.example` for more details.
- Updated Key-Value store configuration. See `.env.example` for more details.
- Updated healthcheck route to `/api/healthcheck`
- Prefixed `OIDC_ENABLED`, `OIDC_LOGIN_TEXT` and `OIDC_LOGOUT_ENABLED` env 
  variables `NUXT_PUBLIC_`
- prefixed `SESSION_SECRET` with `OIDC_`
