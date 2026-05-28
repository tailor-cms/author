# /activity

Feature slice for the **Activity** entity — the structural primitive
of a repository's content tree. Originally a single learning activity
(a module, a page); today the same row also powers outline
construction (modules, pages), content containers that lay out and
hold content elements (sections, exams), and flat collection items 
(short-form content collection like Articles).

The slice owns the full lifecycle: CRUD, reorder, soft-delete with
cascade detach, restore, publish, external preview, workflow status,
deep-clone, and linked-content (link, unlink, source, copies).
Mounted under `/repositories/:repositoryId/activities`, scoped to a
repository the caller already has access to.
