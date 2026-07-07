// Video provider URL utilities; shared across frontend and backend
const EMBED_PATTERNS = [
  [
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    (id) => `https://www.youtube.com/embed/${id}`,
  ],
  [
    /vimeo\.com\/(\d+)/,
    (id) => `https://player.vimeo.com/video/${id}`,
  ],
  [
    /dailymotion\.com\/video\/([a-zA-Z0-9]+)/,
    (id) => `https://www.dailymotion.com/embed/video/${id}`,
  ],
];

const YT_RE = EMBED_PATTERNS[0][0];

export function toEmbedUrl(url) {
  for (const [re, builder] of EMBED_PATTERNS) {
    const match = url.match(re);
    if (match) return builder(match[1]);
  }
  return null;
}

export function extractYtVideoId(url) {
  const match = url.match(YT_RE);
  return match ? match[1] : null;
}

// Predictable still image for a YouTube video. `hqdefault` always exists for
// public videos (unlike `maxresdefault`). null when the URL isn't YouTube.
export function getYtThumbnailUrl(url) {
  const id = extractYtVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export function isYouTubeUrl(url) {
  return YT_RE.test(url);
}

// External preview image for a link asset: a YouTube video's predictable still
// (hqdefault, guaranteed for public videos), else the OpenGraph image collected
// on import.
export function getLinkPreviewUrl(meta) {
  return getYtThumbnailUrl(meta?.url) || meta?.thumbnail || null;
}
