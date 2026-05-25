/**
 * Markdown -> HTML renderer for the agent panel, powered by `marked`.
 * Entity references travel as markdown links with the `entity://` scheme;
 * the link renderer below routes them through `resolveEntityHref` to
 * build editor URLs.
 */
import { Marked } from 'marked';

export interface EntityRef {
  kind: 'activity' | 'element';
  id: number;
  uid?: string;
}

export interface RenderOptions {
  resolveEntityHref?: (ref: EntityRef) => string | null;
}

const ENTITY_HREF = /^entity:\/\/(activity|element)\/(\d+)(?:\/([\w-]+))?$/i;
// Allowed URL schemes for agent-emitted external links
const SAFE_EXTERNAL_HREF = /^(https?:|mailto:|\/|#)/i;

/**
 * Parse `entity://activity/<id>` and `entity://element/<outlineActivityId>/<uid>`
 * into an editor ref. The element form carries the outline activity id
 * (not the element's direct parent) so the editor route can render it,
 * plus the uid for the deep-link query param.
 */
function parseEntityHref(href: string): EntityRef | null {
  const match = ENTITY_HREF.exec(href || '');
  if (!match) return null;
  const [, kind, id, uid] = match;
  return {
    kind: kind!.toLowerCase() as 'activity' | 'element',
    id: Number(id),
    uid,
  };
}

function createMarked(opts: RenderOptions): Marked {
  const md = new Marked();
  // Renderer overrides tag every element with an `agent-md-*` class so the
  // chat bubble's :deep() rules can target them.
  md.use({
    renderer: {
      heading(token: any) {
        // Demote markdown headings by 2 so "# Title" renders as <h3>, never
        // colliding with the outer page outline (real h1/h2 belong to the
        // surrounding app).
        const tag = `h${token.depth + 2}`;
        const cls = `agent-md-h${token.depth}`;
        const body = this.parser.parseInline(token.tokens);
        return `<${tag} class="${cls}">${body}</${tag}>`;
      },
      paragraph(token: any) {
        const body = this.parser.parseInline(token.tokens);
        return `<p class="agent-md-p">${body}</p>`;
      },
      list(token: any) {
        // marked passes the list's tokens, not a pre-rendered body - we
        // iterate items manually through this.listitem() to keep the
        // default <li> wrapping intact while adding the wrapper class.
        const tag = token.ordered ? 'ol' : 'ul';
        let body = '';
        for (const item of token.items) {
          body += this.listitem(item);
        }
        return `<${tag} class="agent-md-${tag}">\n${body}</${tag}>\n`;
      },
      codespan(token: any) {
        return `<code class="agent-md-inline-code">${token.text}</code>`;
      },
      link(v: any) {
        const body = this.parser.parseInline(v.tokens);
        // Entity refs are internal deep-links into the editor. Route them
        // through the caller's resolver and render same-tab; if the resolver
        // can't build a href (e.g. no active repo), degrade to plain text.
        const entity = parseEntityHref(v.href);
        if (entity && opts.resolveEntityHref) {
          const href = opts.resolveEntityHref(entity);
          if (!href) return body;
          const safe = href.replace(/"/g, '&quot;');
          return `<a class="agent-md-entity" href="${safe}">${body}</a>`;
        }
        // External links open in a new tab; scheme is whitelisted to block
        // javascript:/data: payloads, quote-escape covers attribute breakout.
        const raw = v.href || '';
        const href = SAFE_EXTERNAL_HREF.test(raw)
          ? raw.replace(/"/g, '&quot;')
          : '#';
        return (
          `<a class="agent-md-link" href="${href}"` +
          ` target="_blank" rel="noopener">${body}</a>`
        );
      },
    },
  });
  return md;
}

export function renderMarkdown(
  input: string,
  opts: RenderOptions = {},
): string {
  if (!input) return '';
  return createMarked(opts).parse(input) as string;
}
