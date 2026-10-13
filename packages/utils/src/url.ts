/**
 * URLs in user-written messages.
 */
import { splitBy } from './splitBy';

// An allowlist: `javascript:` or `data:` in an href is stored XSS
const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:'];

// The parsed URL, or null when the value is not a URL at all
export const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

/**
 * The URL as an `href`, or null when it should not become a link.
 * Callers then show the raw text, so an unsafe URL is visible but inert.
 */
export const safeHref = (value: string): string | null => {
  const url = parseUrl(value);
  if (!url || !SAFE_PROTOCOLS.includes(url.protocol)) return null;
  return url.href;
};

// Adds the scheme people leave off (`www.example.com`); the label
// keeps what was typed
const withScheme = (value: string): string =>
  /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;

// A bare URL starts with a scheme or `www.`
const START = String.raw`\b(?:[a-z][a-z0-9+.-]*://|www\.)`;
const REST = String.raw`(?:[^\s<]*\([^\s<]*[^\s<.,;:!?'"]|[^\s<]*[^\s<.,;:!?'")])`;
const URL_PATTERN = new RegExp(START + REST, 'gi');

export interface LinkifySegment {
  text: string;
  href: string | null;
}

const parseLink = ([text]: RegExpExecArray): LinkifySegment | null => {
  const href = safeHref(withScheme(text));
  return href ? { text, href } : null;
};

const parseText = (text: string): LinkifySegment[] =>
  text ? [{ text, href: null }] : [];

const parseLinks = splitBy(URL_PATTERN, parseLink, parseText);

// Splits text into plain and linkable segments
export const linkify = (text: string): LinkifySegment[] => parseLinks(text);
