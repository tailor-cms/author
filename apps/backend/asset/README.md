# /asset

Feature slice for the **Asset** entity; the repository's library of
uploaded files (images, video, audio, documents) and external link
sources. Owns the upload / import-from-link pipeline (with Open Graph
collection), per-asset metadata, soft-delete with retained storage
(published content elements may still hold `storage://` references),
bulk delete, signed download URLs, and the legacy storage-key resolver
that the older storage API still relies on. Mounted under
`/repositories/:repositoryId/assets`; the slice also hosts two
sub-routers under the same scope — **discovery** (`/discover`,
cross-provider web search) and **indexing** (`/indexing`, OpenAI
vector-store ingestion that powers the AI agent's knowledge base).
