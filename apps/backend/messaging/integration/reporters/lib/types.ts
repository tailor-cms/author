import type {
  Attachment,
  AttachmentField,
  AttachmentPreview,
} from '@tailor-cms/interfaces/comment.ts';
import type { CloudEvent } from '#shared/events/bus.ts';

// Re-exported for convenience.
export type { Attachment, AttachmentField, AttachmentPreview };
export type FieldValue = string | number | false | null | undefined;

// What a reporter asks for; `formatAnnouncement` turns it into an
// `Attachment`.
export type AttachmentSpec = Omit<Attachment, 'fields'> & {
  // The small rows under the post, written as a plain map:
  // `{ 'Published by': 'Ada Lovelace', Items: 12 }`.
  fields?: Record<string, FieldValue>;
};

// One post by a reporter
export interface Announcement {
  // The plain line: `Published <#activity:7|Intro>`.
  content: string;
  // The fuller version, shown in the thread.
  attachments?: Attachment[];
}

// A window is the events gathered into one post (batch). This is resolved
// once for it, so a reporter never queries anything itself.
export interface WindowContext {
  // Null unless the whole window is one person's doing.
  actorLabel: string | null;
}

// The part every Activity (structural entity) event carries
export interface ActivityData {
  id?: number | null;
  name?: string | null;
  typeLabel?: string | null;
}

export interface Reporter<T = Record<string, unknown>> {
  // The integration its posts come from: `publishing` posts as the
  // Publishing integration.
  key: string;
  name: string;
  icon: string;
  // The topics it answers for, from `EVENT_CATALOG`: structure takes
  // both `ActivityCreated` and `ActivityRemoved`.
  events: string[];
  // How long to collect events before posting, so that fifty edits read
  // as one line.
  windowMs?: number;
  // Gets every event of one type from one window. Null means there is
  // nothing worth announcing.
  format(events: CloudEvent<T>[], ctx: WindowContext): Announcement | null;
}

// A reporter in the registry, whatever payload it reads.
export type AnyReporter = Reporter<any>;
