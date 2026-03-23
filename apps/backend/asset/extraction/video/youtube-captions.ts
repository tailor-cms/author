/**
 * Fetch captions/transcript from YouTube videos.
 * Uses the youtube-transcript package which scrapes YouTube's internal
 * caption API - no API key required. Works with auto-generated and
 * manual captions.
 */
import { createLogger } from '#logger';
import { YoutubeTranscript } from './youtube-transcript.js';

const logger = createLogger('asset:youtube-captions');

// Max caption text stored in meta (100KB - covers ~1hr of video)
const MAX_CAPTION_CHARS = 100_000;
const YT_URL_RE =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;

export function extractVideoId(url: string): string | null {
  const match = url.match(YT_URL_RE);
  return match ? match[1] : null;
}

export function isYouTubeUrl(url: string): boolean {
  return YT_URL_RE.test(url);
}

/**
 * Fetch transcript text from a YouTube video.
 * Returns plain text (no timestamps) suitable for indexing.
 * Returns empty string if captions are unavailable.
 */
export async function fetchYouTubeCaptions(
  url: string,
): Promise<string> {
  const videoId = extractVideoId(url);
  if (!videoId) return '';
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcript?.length) return '';
    const text = transcript
      .map((entry: any) => entry.text)
      .join(' ');
    logger.debug({ videoId, chars: text.length }, 'Captions fetched');
    return text;
  } catch (err: any) {
    logger.debug({ videoId, err: err.message }, 'Captions unavailable');
    return '';
  }
}

/**
 * Fetch YouTube captions and update asset meta.
 * Returns the full caption text for synthetic document indexing.
 * Stores a trimmed copy in meta for inspection/direct context use.
 */
export async function extractAndStoreCaptions(
  asset: any,
): Promise<string> {
  const url = asset.meta?.url;
  if (!url || !isYouTubeUrl(url)) return '';
  const captions = await fetchYouTubeCaptions(url);
  if (!captions) return '';
  await asset.update({
    meta: {
      ...asset.meta,
      hasCaptions: true,
      captions: captions.length > MAX_CAPTION_CHARS
        ? `${captions.slice(0, MAX_CAPTION_CHARS)}…`
        : captions,
    },
  });
  logger.info(
    { assetId: asset.id, chars: captions.length },
    'YouTube captions stored',
  );
  return captions;
}
