# /comment

Feature slice for the Comment entity. Mounted under
`/repositories/:repositoryId/comments` so every comment is implicitly
scoped to a repository (the parent slice's `getRepository` + access
guard handle that scoping).
