// Stored pages report their height to the element's frame, so the frame
// grows to fit the content (e.g. on narrow screens). The save tool adds
// the reporter to every page it stores.
const RESIZE_MESSAGE = 'tailor:interactive:resize';

// Does nothing when the page is opened on its own (not in a frame).
const RESIZE_SCRIPT = `<script data-tailor-resize>(() => {
  if (window.parent === window) return;
  const root = document.documentElement;
  const post = () => window.parent.postMessage({
    type: '${RESIZE_MESSAGE}',
    height: Math.ceil(root.getBoundingClientRect().height),
  }, '*');
  new ResizeObserver(post).observe(root);
})();</script>`;

const RESIZE_TAG =
  /<script\b[^>]*\sdata-tailor-resize\b[^>]*>[\s\S]*?<\/script>/gi;

// Adds the reporter before the last `</body>`, replacing an old one.
export function addResizeReporter(html: string): string {
  const page = stripResizeReporter(html);
  const bodyEnd = page.toLowerCase().lastIndexOf('</body>');
  if (bodyEnd === -1) return `${page}${RESIZE_SCRIPT}`;
  return `${page.slice(0, bodyEnd)}${RESIZE_SCRIPT}${page.slice(bodyEnd)}`;
}

export function stripResizeReporter(html: string): string {
  return html.replace(RESIZE_TAG, '');
}
