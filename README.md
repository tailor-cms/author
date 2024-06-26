<div align="center">
  <img width="180" src="./apps/frontend/public/img/default-logo-compact.svg">
</div>

# Tailor CMS

[![Open Source
Love](https://badgen.net/badge/Open%20Source/%E2%9D%A4/3eaf8e)](https://github.com/ellerbrock/open-source-badge/)

Configurable headless CMS for complex content structures.

## Installation

### Prerequisites

- Node.js (>= 22.x): https://nodejs.org/en/download/
- pnpm (>= 9.0.6): https://pnpm.io/installation
- PostgreSQL (>= 9.4): https://www.postgresql.org/download/
- Clone this repo

### Development

- Run `pnpm setup:dev` in the project directory and enter the required details
- Run `pnpm dev` to start the dev server

### Production

- Application is configured via environment variables contained in a
  file named `.env`. Use the `.env.example` file as a template: 
  `cp .env.example .env` and enter configuration details.
- Bundle client by issuing `pnpm build`
- To run app execute: `pnpm start`

## Content repository structure configuration

Repository structure can be altered using the Tailor configuration file, 
which must be placed inside the root directory and named `tailor.config.js`.

## Testing

- `pnpm e2e:functional`
- `pnpm e2e:visual`

This project is tested with BrowserStack.
