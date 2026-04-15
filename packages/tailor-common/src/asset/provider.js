// Link provider detection; shared across frontend and backend
const PROVIDER_PATTERNS = [
  [/(?:youtube\.com|youtu\.be)/i, 'youtube', 'VIDEO'],
  [/vimeo\.com/i, 'vimeo', 'VIDEO'],
  [/dailymotion\.com/i, 'dailymotion', 'VIDEO'],
  [/spotify\.com/i, 'spotify', 'AUDIO'],
  [/soundcloud\.com/i, 'soundcloud', 'AUDIO'],
];

/**
 * Detect provider slug and content type from a URL.
 * @param {string} url
 * @returns {{ provider?: string, contentType?: string }}
 */
export function detectLinkProvider(url) {
  try {
    const hostname = new URL(url).hostname;
    for (const [pattern, provider, contentType] of PROVIDER_PATTERNS) {
      if (pattern.test(hostname)) return { provider, contentType };
    }
  } catch { /* malformed URL */ }
  return {};
}
