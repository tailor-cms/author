import type { Ref } from 'vue';
import { debounce } from 'lodash-es';

// Hard cap so long previews (huge tables, long transcripts)
// don't register thousands of ranges.
const MAX_RANGES = 300;
const HIGHLIGHT_NAME = 'search-term';
const RESCAN_DELAY_MS = 200;

let registry: any = null;

const isSupported = () =>
  typeof CSS !== 'undefined' && 'highlights' in (CSS as any);

function getRegistry() {
  if (!registry) {
    registry = new (window as any).Highlight();
    (CSS as any).highlights.set(HIGHLIGHT_NAME, registry);
  }
  return registry;
}

/**
 * Extracts highlightable words from a websearch-style query: quoted
 * phrases are unwrapped, `-exclusions` dropped, single characters
 * skipped, duplicates removed.
 */
export function parseSearchTerms(query?: string | null): string[] {
  if (!query) return [];
  const words = query
    .split(/\s+/)
    .filter((it) => it && !it.startsWith('-'))
    .map((it) => it.replace(/["']/g, '').toLowerCase())
    .filter((it) => it.length > 1);
  return [...new Set(words)];
}

/**
 * Marks occurrences of `terms` inside the subtree rendered at `root`
 * using the CSS Custom Highlight API. Highlights are ranges in a
 * document-level registry rather than DOM mutations, so
 * component-managed markup (tiptap, players) stays untouched; style
 * them via a global `::highlight(search-term)` rule. Rescans on
 * subtree mutations so lazily mounted previews get marked too. No-ops
 * in browsers without the API.
 */
export function useSearchHighlight(
  root: Ref<HTMLElement | null | undefined>,
  terms: Ref<string[]>,
) {
  // No CSS Custom Highlight API
  if (!isSupported()) return;
  const registeredRanges: Range[] = [];
  let observer: MutationObserver | null = null;

  const clear = () => {
    if (!registeredRanges.length) return;
    const highlights = getRegistry();
    registeredRanges.forEach((range) => highlights.delete(range));
    registeredRanges.length = 0;
  };

  const markNode = (node: Node, highlights: any) => {
    const text = node.textContent?.toLowerCase();
    if (!text) return;
    for (const term of terms.value) {
      let offset = text.indexOf(term);
      while (offset !== -1 && registeredRanges.length < MAX_RANGES) {
        const range = new Range();
        range.setStart(node, offset);
        range.setEnd(node, offset + term.length);
        highlights.add(range);
        registeredRanges.push(range);
        offset = text.indexOf(term, offset + term.length);
      }
    }
  };

  const scan = () => {
    clear();
    if (!root.value || !terms.value.length) return;
    const highlights = getRegistry();
    const walker = document.createTreeWalker(root.value, NodeFilter.SHOW_TEXT);
    while (walker.nextNode() && registeredRanges.length < MAX_RANGES) {
      markNode(walker.currentNode, highlights);
    }
  };

  const rescan = debounce(scan, RESCAN_DELAY_MS);

  onMounted(() => {
    scan();
    if (!root.value) return;
    observer = new MutationObserver(rescan);
    observer.observe(root.value, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });

  watch(terms, rescan);

  onBeforeUnmount(() => {
    observer?.disconnect();
    rescan.cancel();
    clear();
  });
}
