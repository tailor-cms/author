<div align="center">
  <img width="180" src="./client/assets/img/default-logo-compact.svg">
</div>

# Tailor CMS

[![CircleCI build
status](https://badgen.net/circleci/github/ExtensionEngine/tailor/develop?style=svg)](https://circleci.com/gh/ExtensionEngine/tailor)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/f3eab80316244b7b959b7bbf3d7c3ace)](https://www.codacy.com/gh/ExtensionEngine/tailor/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=ExtensionEngine/tailor&amp;utm_campaign=Badge_Grade)
[![Known
Vulnerabilities](https://badgen.net/snyk/ExtensionEngine/tailor/develop)](https://snyk.io/test/github/ExtensionEngine/tailor)
[![GitHub package
version](https://badgen.net/github/release/ExtensionEngine/tailor)](https://github.com/ExtensionEngine/tailor/releases)
[![GitHub
license](https://badgen.net/github/license/ExtensionEngine/tailor)](https://github.com/ExtensionEngine/tailor/blob/develop/LICENSE)
[![js @extensionengine
style](https://badgen.net/badge/code%20style/@extensionengine/black)](https://github.com/ExtensionEngine/eslint-config)
[![style @extensionengine
style](https://badgen.net/badge/stylelint/@extensionengine/black)](https://github.com/ExtensionEngine/stylelint-config)
[![Open Source
Love](https://badgen.net/badge/Open%20Source/%E2%9D%A4/3eaf8e)](https://github.com/ellerbrock/open-source-badge/)

Configurable headless CMS for complex content structures.

## Dependencies

- Node.js (>= 20.x)
- pnpm (>= 8.3.1)
- PostgreSQL (>= 9.4)

## Installation

### Prerequisites

- Node.js: https://nodejs.org/en/download/
- pnpm: https://pnpm.io/installation
- PostgreSQL: https://www.postgresql.org/download/
- Clone this repo

### Setup

- Run `pnpm i` in the repo directory
- Create a database in PostgreSQL
- Application is configured via environment variables contained in a
  file named `.env`. Use the `.env.example` file as a template: 
  `cp .env.example .env` and enter configuration details.
- Initialize database by running `pnpm db migrate`
- To enable demo repository schema configuration copy `tailor.config.js.example`
  into `tailor.config.js.`. For more details about the custom schema configuration
  please refer [to this guide](https://extensionengine.github.io/tailor-docs/tailor/developer-guide/configuration.html).
- Configure asset storage proxy by following the steps 
  [in this guide](https://extensionengine.github.io/tailor-docs/tailor/developer-guide/storage-proxy.html)
  based on your environment.
- You can create admin user by running `pnpm add:admin <email> <password>`

### Development

`pnpm dev`

### Production

- Bundle client by issuing `pnpm build`
- `pnpm start`

## Content repository structure

Repository structure can be altered using tailor configuration file, which must
be placed inside the root directory and named `tailor.config.js`.

Use the `tailor.config.js.example` file as a template:

```
$ cp tailor.config.js.example tailor.config.js
```

and enter the configuration details. At the current time, it is not possible to 
override the filename or location of the configuration file.
