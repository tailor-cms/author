# /content-element

Feature slice for the ContentElement entity. 
Mounted under `/repositories/:repositoryId/content-elements`
so every element is implicitly scoped to a repository (the parent slice's
`getRepository` + access guard handle that scoping).
