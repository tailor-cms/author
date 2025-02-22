ARG PNPM_HOME="/root/.local/share/pnpm"
ARG PNPM_VERSION="9.15.0"

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
