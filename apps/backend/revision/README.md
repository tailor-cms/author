# Revision

Feature slice for read-only access to the per-model audit log. Revisions
are append-only rows written by the hooks in `models/revision.hooks.js`
whenever a Repository / Activity / ContentElement is created, updated,
restored, or removed. There are no write endpoints in this slice.

Mounted under `/repositories/:repositoryId/revisions`, every query is
implicitly scoped to a repository.
