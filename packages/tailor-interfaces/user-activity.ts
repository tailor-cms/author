// Presence + activity context published over the repository SSE feed.
//
// Carried both ways:
//   - FE -> BE on `POST /repositories/:id/feed` (start) and
//     `DELETE /repositories/:id/feed` (end) to report what the user is
//     currently focused on.
//   - BE -> all FE clients via SSE `user_activity:start` /
//     `user_activity:end` events broadcast on the repository channel.
//
// `connectedAt` is stamped server-side when the context is first stored
// and travels back to clients on the SSE broadcast; clients should not
// rely on it being present in their own input.
export interface UserActivityContext {
  // SSE connection id
  sseId?: string;
  // Required - identifies the repository channel to broadcast on.
  repositoryId: number;
  // Optional sub-focus within the repository.
  activityId?: number;
  // Content element in focus, identified by its uid.
  elementId?: string;
  // Forward-compatible: clients may carry additional focus keys
  // (page, view, ...) that the server stores verbatim and matches
  // structurally on end.
  [key: string]: unknown;
}

// Server-augmented variant returned to clients via SSE broadcast and
// surfaced on the active-users list endpoint.
export interface UserActivityContextStored extends UserActivityContext {
  connectedAt: string;
}
