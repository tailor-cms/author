ARG PNPM_HOME="/root/.local/share/pnpm"
ARG PNPM_VERSION="8.8.0"

FROM node:20.8.0-alpine3.17
# Prerequisites
ARG PNPM_HOME
ARG PNPM_VERSION
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
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
