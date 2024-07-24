# Installation Guide

## Setting Up Your Development Machine

### Introduction

This guide is designed to help you prepare your development machine for Tailor 
development. You have two primary options for setting up the necessary 
dependencies:

- **Using Docker:** Dependencies are managed through Docker compose, 
  simplifying the setup process.
- **Manual Setup:** This approach requires manually installing and configuring
  the necessary services.

### General Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js (version 22.x or higher)](https://nodejs.org/en/download/)
- [pnpm (version 9.0.6 or higher)](https://pnpm.io/installation)
- Clone the Tailor repository to your local machine.

### Setup Using Docker

1. Install [Docker](https://docs.docker.com/engine/install/).
2. Start the required services with Docker Compose:

```sh 
docker compose -f docker-compose.dev.yaml up -d
```

3. Initialize the development environment:

```sh 
pnpm setup:dev
```

4. Launch the backend and frontend applications in development mode:

```sh 
pnpm dev
```

### Manual Setup (Native Prerequisite Services)

1. Install and configure 
   [PostgreSQL (version 9.4 or higher)](https://www.postgresql.org/download/).
2. Initialize the development environment:

```sh 
pnpm setup:dev
```

3. Launch the backend and frontend applications in development mode:

```sh 
pnpm dev
```

## Running the Application in Production Mode

1. The application's configuration is managed through environment variables 
   in a `.env` file. Start by copying the `.env.example` file to `.env` and 
   entering your configuration details:

```sh 
cp .env.example .env
```

2. Build the application:

```sh 
pnpm build
```

3. Migrate the database:

```sh 
pnpm db:migrate
```

4. Start the application:

```sh 
pnpm start
```

## Environment Configuration

The development environment setup script (`setup:dev`) automatically configures 
default  environment variables and populates the `.env` file in the project 
root. For a complete list of configuration options, refer to the `.env.example`
file. Use this file as a template to create your `.env` file and customize the
configuration details as necessary.

```sh
# Logger
LOG_LEVEL=info

# -------------------------------------------------------------------
# Server configuration
# -------------------------------------------------------------------
# Set to page DNS record once deployed
HOSTNAME=localhost
# Server port
PORT=3000
# Protocol is used to generate the app URL.
# If omitted, if HOSTNAME is set to local address it will be set to http,
# otherwise it will be set to https.
PROTOCOL=http
# Port on which the app is available to the end user. In development
# mode, this configures the vite dev server which servers the application
# frontend. In production, this configures the port on which the app is
# available to the end user (443, if app is deployed with https configured).
REVERSE_PROXY_PORT=8080
# If the app is behind a reverse proxy and rate limiting is enabled
# See https://expressjs.com/en/guide/behind-proxies.html
REVERSE_PROXY_TRUST=false

# -------------------------------------------------------------------
# Database configuration
# -------------------------------------------------------------------
# You can pass the database connection string
DATABASE_URI=postgres://user:pass@hostname:port/database
# or individual database connection parameters
# DATABASE_NAME=tailor_author
# DATABASE_USER=tailor
# DATABASE_PASSWORD=tailor
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# DATABASE_ADAPTER=postgres

# -------------------------------------------------------------------
# In-memory store configuration
# -------------------------------------------------------------------
# Supported providers: memory, redis
# For production, with multiple instances, redis is required to be able
# to share state between instances.

# Can be set to memory or redis
STORE_PROVIDER=memory
# ttl - time to live measured in seconds
# records do not expire by default
STORE_TTL=0
# If Redis is set as store provider, these are the connection parameters
# REDIS_PORT=6379
# REDIS_HOST=localhost
# REDIS_PASSWORD=

# -------------------------------------------------------------------
# Security and authentication
# -------------------------------------------------------------------
# Origins allowed in CORS requests. Multiple origins can be listed by using
# comma as a separator. In development, this matches vite dev server address:
CORS_ALLOWED_ORIGINS=http://localhost:8080
# Bcrypt salt rounds for password hashing
# For more information see https://www.npmjs.com/package/bcrypt
AUTH_SALT_ROUNDS=10
# JWT tokens are used to authenticate requests to the API.
# For more information see https://www.npmjs.com/package/jsonwebtoken.
AUTH_JWT_SECRET=example_secret123!
AUTH_JWT_ISSUER=tailor
AUTH_JWT_COOKIE_NAME=access_token
AUTH_JWT_COOKIE_SECRET=example_cookie_sign_secret123!
# Enable rate limiting for authentication routes
# Make sure you configure REVERSE_PROXY_TRUST
ENABLE_RATE_LIMITING=false

# -------------------------------------------------------------------
# OIDC
# -------------------------------------------------------------------
# Tailor supports OIDC authentication
# Configuration can be skipped if OIDC is not used
# OIDC_ENABLED=0
# OIDC_ALLOW_SIGNUP=0
# OIDC_LOGIN_TEXT=Sign in with OIDC
# OIDC_DEFAULT_ROLE=ADMIN
# OIDC_CLIENT_ID=
# OIDC_CLIENT_SECRET=
# OIDC_ISSUER=
# OIDC_JWKS_URL=
# OIDC_AUTHORIZATION_ENDPOINT=
# OIDC_TOKEN_ENDPOINT=
# OIDC_USERINFO_ENDPOINT=
# OIDC_LOGOUT_ENABLED=1
# OIDC_LOGOUT_ENDPOINT=
# Use OIDC_POST_LOGOUT_URI_KEY if OIDC provider uses post logout uri key not
# aligned with OIDC RP-Initiated Logout standard key (post_logout_redirect_uri)
# OIDC_POST_LOGOUT_URI_KEY=
# SESSION_SECRET=

# -------------------------------------------------------------------
# Email configuration for sending notifications
# -------------------------------------------------------------------
EMAIL_SENDER_NAME=Tailor
EMAIL_SENDER_ADDRESS=tailor@example.com
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
# Can be omitted if using SSL
EMAIL_PORT=
EMAIL_SSL=1
EMAIL_TLS=

# -------------------------------------------------------------------
# File storage configuration
# -------------------------------------------------------------------
# Tailor supports two storage providers: Amazon S3 and filesystem.
# Can be set to amazon or filesystem
STORAGE_PROVIDER=filesystem
# If filesystem provider is used, this is the path where files will be stored
STORAGE_PATH=data
# If amazon provider is used, these are the credentials for the S3 bucket
# STORAGE_KEY=
# STORAGE_SECRET=
# STORAGE_REGION=us-east-1
# STORAGE_BUCKET=my-bucket

# -------------------------------------------------------------------
# OAuth2 client credentials for authenticating with end-system
# -------------------------------------------------------------------
# CONSUMER_CLIENT_ID=tailor_dev_id
# CONSUMER_CLIENT_SECRET=tailor_dev_secret
# CONSUMER_CLIENT_TOKEN_HOST=http://127.0.0.1:3000
# CONSUMER_CLIENT_TOKEN_PATH=/api/oauth2/token

# Consumer publish notification settings
# Hook to be called upon publishing a resource
# [Deprecated] CONSUMER_WEBHOOK_URL in favor of CONSUMER_PUBLISH_WEBHOOK.
# CONSUMER_PUBLISH_WEBHOOK=http://127.0.0.1:3000/my-publish-hook-route

# Route to be called in the editor upon clicking preview button.
# To enable this, end-system/consumer needs to implement preview mechanism.
# Route is secured using OAuth2 client credentials above.
# [Deprecated] PREVIEW_URL in favor of CONSUMER_PREVIEW_WEBHOOK.
# CONSUMER_PREVIEW_WEBHOOK=http://localhost/api/v1/preview/

# -------------------------------------------------------------------
# Open AI configuration, optional
# -------------------------------------------------------------------
# Backend
AI_MODEL_ID=gpt-4o
AI_SECRET_KEY=
# Frontend, runtime configuration
NUXT_PUBLIC_AI_UI_ENABLED=

# -------------------------------------------------------------------
# Test configuration
# -------------------------------------------------------------------
# Warning: Enabling test routes will expose data manipulation endpoints
# including the ability to reset the database.
# ENABLE_TEST_API_ENDPOINTS=

# Do not group published resources by outline item id.
# repository/id/resourceId* instead of repository/id/outlineId/resourceId*
FLAT_REPO_STRUCTURE=1

# Force color output (for logs)
# https://nodejs.org/api/tty.html#writestreamgetcolordepthenv
FORCE_COLOR=1
```
