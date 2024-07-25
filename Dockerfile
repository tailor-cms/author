ARG PNPM_HOME="/root/.local/share/pnpm"
ARG PNPM_VERSION="9.0.6"

FROM node:22.1.0-alpine3.18
# Prerequisites
ARG PNPM_HOME
ARG PNPM_VERSION
ARG NUXT_PUBLIC_AI_UI_ENABLED
ARG NUXT_PUBLIC_AVAILABLE_SCHEMAS

# git and ssh
RUN apk add openssh-client && apk add git
RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan -H github.com >> ~/.ssh/known_hosts
# pnpm
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
ENV PNPM_HOME=$PNPM_HOME
ENV PATH="${PATH}:${PNPM_HOME}"
# Install dependencies and build
WORKDIR /app
# TODO: Copy and install deps first, then copy the rest; once turborepo is added
COPY ./ ./
RUN pnpm i
ENV NUXT_PUBLIC_AI_UI_ENABLED=${NUXT_PUBLIC_AI_UI_ENABLED}
ENV NUXT_PUBLIC_AVAILABLE_SCHEMAS=${NUXT_PUBLIC_AVAILABLE_SCHEMAS}
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
