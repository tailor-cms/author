import { decode } from 'html-entities';

const tagRegex = /<[^>]+>/g;

/**
 * Flattens an HTML string into single-line plain text: drops tags, decodes
 * the entities they leave behind, then collapses whitespace. Rich text is
 * stored as HTML, so a literal `&` lives in the data as `&amp;` and has to
 * be decoded before it can be rendered as text.
 *
 * Tags are stripped before decoding on purpose. Decoding first would turn an
 * escaped, authored `&lt;b&gt;` into a real `<b>`, which the tag pass would
 * then delete along with the text the author actually wrote.
 */
export const htmlToText = (html: string) =>
  decode(html.replace(tagRegex, ' '))
    .replace(/\s+/g, ' ')
    .trim();
