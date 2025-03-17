ARG PNPM_HOME="/root/.local/share/pnpm"
ARG PNPM_VERSION="10.6.3+sha512.bb45e34d50a9a76e858a95837301bfb6bd6d35aea2c5d52094fa497a467c43f5c440103ce2511e9e0a2f89c3d6071baac3358fc68ac6fb75e2ceb3d2736065e6"

FROM node:22.12.0-alpine3.20

# Prerequisites
ARG PORT=3000
ARG PNPM_HOME
ARG PNPM_VERSION

# git and ssh
RUN apk add openssh-client && apk add git
RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan -H github.com >> ~/.ssh/known_hosts

# pnpm
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
ENV PNPM_HOME=$PNPM_HOME
ENV PATH="${PATH}:${PNPM_HOME}"

ENV NODE_OPTIONS=--max_old_space_size=3072

# Install dependencies and build
WORKDIR /app
# TODO: Copy and install deps first, then copy the rest; once turborepo is added
COPY ./ ./
RUN pnpm i
RUN pnpm build

EXPOSE ${PORT}
CMD ["pnpm", "start"]
