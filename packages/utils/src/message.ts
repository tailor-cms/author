/**
 * Message token grammar shared by the backend and every client surface.
 *
 * Messages are plain text with inline tokens, like on Slack or Discord.
 * One plain-text value serves mail, search, the editor sidebar and the
 * discussion channel alike, and still reads fine where tokens are unknown.
 *
 *   <@12|Ivan Horvat>               user mention
 *   <#activity:42|The Basics>       activity reference
 *   <#element:12.9f3a-...|Image>    content-element reference
 *   <#asset:7|diagram.png>          asset reference
 *
 * An element id is `<outlineActivityId>.<uid>`; read it through
 * `parseElementRef`. The label after `|` is a fallback for when the
 * target is gone: clients prefer live entity data.
 */
import { ReferenceType } from '@tailor-cms/interfaces/comment';

import { parseMarkup } from './markup';
import { linkify } from './url';
import { splitBy } from './splitBy';

const REFERENCE_TYPES: string[] = Object.values(ReferenceType);

export interface TextToken {
  kind: 'text';
  text: string;
}

export interface MentionToken {
  kind: 'mention';
  userId: number;
  label: string;
  raw: string;
}

export interface ReferenceToken {
  kind: 'reference';
  entityType: ReferenceType;
  entityId: string;
  label: string;
  raw: string;
}

export type MessageToken = TextToken | MentionToken | ReferenceToken;

// `<@id|label>` and `<#type:id|label>`; the label is optional
const TOKEN_PATTERN = /<([@#])([^>|]+)(?:\|([^>]*))?>/g;

const parseMention = (
  payload: string,
  label: string,
  raw: string,
): MentionToken | null => {
  const userId = Number.parseInt(payload, 10);
  if (!Number.isInteger(userId) || userId <= 0) return null;
  return { kind: 'mention', userId, label: label || `user ${userId}`, raw };
};

const parseReference = (
  payload: string,
  label: string,
  raw: string,
): ReferenceToken | null => {
  const separator = payload.indexOf(':');
  if (separator <= 0) return null;
  const entityType = payload.slice(0, separator);
  const entityId = payload.slice(separator + 1);
  if (!REFERENCE_TYPES.includes(entityType) || !entityId) return null;
  return {
    kind: 'reference',
    entityType: entityType as ReferenceType,
    entityId,
    label: label || entityId,
    raw,
  };
};

const parseToken = ([raw, sigil, payload, label = '']: RegExpExecArray) =>
  sigil === '@'
    ? parseMention(payload, label, raw)
    : parseReference(payload, label, raw);

const parseText = (text: string): MessageToken[] =>
  text ? [{ kind: 'text', text }] : [];

const parseTokens = splitBy<MessageToken>(TOKEN_PATTERN, parseToken, parseText);

// Malformed tokens stay verbatim text, so a typo never swallows content
export const parseMessage = (content: string): MessageToken[] =>
  parseTokens(content);

export const extractMentions = (content: string): MentionToken[] =>
  parseMessage(content).filter(
    (it): it is MentionToken => it.kind === 'mention',
  );

export const extractReferences = (content: string): ReferenceToken[] =>
  parseMessage(content).filter(
    (it): it is ReferenceToken => it.kind === 'reference',
  );

// The typed words alone, without mentions and references
export const extractText = (content: string): string =>
  parseMessage(content)
    .filter((it): it is TextToken => it.kind === 'text')
    .map((it) => it.text)
    .join(' ')
    .trim();

// `|` and `>` would end the token early
const sanitizeLabel = (label: string) => label.replace(/[|>]/g, ' ').trim();

export const formatMention = (userId: number, label: string): string =>
  `<@${userId}|${sanitizeLabel(label)}>`;

export const formatReference = (
  entityType: ReferenceType,
  entityId: string | number,
  label: string,
): string => `<#${entityType}:${entityId}|${sanitizeLabel(label)}>`;

export interface ElementRef {
  outlineActivityId: number | null;
  uid: string;
}

/**
 * Splits an element reference id into its routing and identity halves.
 * Older or hand-written ids have no outline activity: still shown,
 * just not linkable.
 */
export const parseElementRef = (entityId: string): ElementRef => {
  const separator = entityId.indexOf('.');
  if (separator <= 0) return { outlineActivityId: null, uid: entityId };
  const outlineActivityId = Number.parseInt(
    entityId.slice(0, separator),
    10,
  );
  return {
    outlineActivityId: Number.isInteger(outlineActivityId)
      ? outlineActivityId
      : null,
    uid: entityId.slice(separator + 1),
  };
};

export const elementRefId = (
  outlineActivityId: number | null | undefined,
  uid: string,
): string => (outlineActivityId ? `${outlineActivityId}.${uid}` : uid);

// Token-free text for mail, notifications and search indexing
export const toPlainText = (content: string): string =>
  parseMessage(content)
    .map((it) => {
      if (it.kind === 'text') return it.text;
      return it.kind === 'mention' ? `@${it.label}` : `#${it.label}`;
    })
    .join('');

// Bare URLs typed into a message, in order, without repeats. Token
// labels and code samples are skipped, so neither gets a link preview.
export const extractUrls = (content: string): string[] => {
  const urls = parseMessage(content)
    .filter((it): it is TextToken => it.kind === 'text')
    .flatMap((it) => parseMarkup(it.text))
    .filter((it) => it.kind === 'text')
    .flatMap((it) => linkify(it.text))
    .map((it) => it.href)
    .filter((it): it is string => !!it);
  return [...new Set(urls)];
};
