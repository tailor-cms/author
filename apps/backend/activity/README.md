# /activity

Feature slice for the Activity entity and its lifecycle operations;
restore, reorder, publish, clone, preview, workflow status, and
linked-content operations. Mounted under
`/repositories/:repositoryId/activities` so every activity is implicitly
scoped to a repository (the parent slice's `getRepository` + access
guard handle that scoping).
