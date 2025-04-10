FROM node:22.14.0-bookworm-slim@sha256:bac8ff0b5302b06924a5e288fb4ceecef9c8bb0bb92515985d2efdc3a2447052 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.8.0 --activate
RUN apt update && apt install -y --no-install-recommends dumb-init
ENTRYPOINT ["dumb-init", "--"]

FROM base AS builder
# git and ssh
RUN apt install -y git
RUN apt install -y openssh-client
RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan -H github.com >> ~/.ssh/known_hosts
WORKDIR /tailor
COPY ./ ./
RUN pnpm install --frozen-lockfile
# increase memory limit for Nuxt frontend build
ENV NODE_OPTIONS=--max_old_space_size=3072
RUN pnpm build
# create a pruned version of tailor backend for the runner image
RUN pnpm --filter=tailor-server --prod deploy /pruned-backend

FROM base AS runner
ENV NODE_ENV=production
ENV ENABLE_TEST_API_ENDPOINTS=false
RUN mkdir -p /tailor/apps/backend
RUN mkdir -p /tailor/apps/frontend/.output
WORKDIR /tailor/apps/
# Copy the pruned backend
COPY --chown=node:node --from=builder /pruned-backend ./backend
# Copy the Nuxt frontend build, served by the backend
COPY --chown=node:node --from=builder /tailor/apps/frontend/.output ./frontend/.output
# Copy excluded dependency
COPY --chown=node:node --from=builder /tailor/apps/backend/node_modules/@tailor-cms/config/dist  ./backend/node_modules/@tailor-cms/config/dist
# Change user & run the app
USER node
WORKDIR /tailor/apps/backend
EXPOSE ${PORT}
CMD ["pnpm", "start:docker"]
