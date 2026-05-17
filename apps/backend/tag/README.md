# /tag

Feature slice for the Tag catalog. Tag creation + attachment happen 
through the repository slice's`/repositories/:repositoryId/tags` 
endpoints, where the tag is created on first use and attached in a 
single transaction.
