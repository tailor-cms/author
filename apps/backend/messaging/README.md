# /messaging

The conversation domain: one message system behind every surface that
shows a comment - the editor sidebar, the element flyout, the Threads
page, mail, and search.

Mounted under `/repositories/:repositoryId/messaging`, so every surface
here is implicitly scoped to a repository.

## Overview

| Term | What it is |
| --- | --- |
| **thread** | The conversation. Everything else hangs off one. |
| **anchored thread** | Sits on an activity or a content element. Found-or-created from the first comment written there, so no write path has to ask for one. |
| **free-standing thread** | The repository's own, opened with a subject. The only kind that can be deleted, and the only kind that can subscribe to a source. |
| **message** | One post in a thread, written by a person or posted by an integration. |
| **comment** | A person's message on anchored content. |
