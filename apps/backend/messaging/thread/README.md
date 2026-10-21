# Threads

A thread groups messages.

## Two kinds

**Anchored** threads hang off an activity or a content element. Nobody
opens one: the first comment written there finds or creates it, so every
existing write path lands in a thread without knowing threads exist.
Resolving is how they close out.

**Free-standing / Repo-level** threads are the repository's own, opened
with a subject. They are the only kind that can be deleted, and the only
kind that can subscribe to a source - an event type, or an integration.
