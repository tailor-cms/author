/**
 * Fetch captions/transcript from YouTube videos.
 * Uses the youtube-transcript package which scrapes YouTube's internal
 * caption API - no API key required. Works with auto-generated and
 * manual captions.
 */
import { createLogger } from '#logger';
import { YoutubeTranscript } from 'youtube-transcript';

const logger = createLogger('asset:youtube-captions');

const YT_URL_RE =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;

/** Extract YouTube video ID from a URL. */
export function extractVideoId(url: string): string | null {
  const match = url.match(YT_URL_RE);
  return match ? match[1] : null;
}

/** Check if a URL is a YouTube video. */
export function isYouTubeUrl(url: string): boolean {
  return YT_URL_RE.test(url);
}

/**
 * Fetch transcript text from a YouTube video.
 * Returns plain text (no timestamps) suitable for indexing.
 * Returns empty string if captions are unavailable.
 */
export async function fetchYouTubeCaptions(url: string): Promise<string> {
  const videoId = extractVideoId(url);
  if (!videoId) return '';
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcript?.length) return '';
    const text = transcript.map((entry: any) => entry.text).join(' ');
    logger.debug(
      { videoId, charCount: text.length },
      'Fetched YouTube captions',
    );
    return text;
  } catch (err: any) {
    // Captions may be disabled or unavailable
    logger.debug(
      { videoId, err: err.message },
      'YouTube captions unavailable',
    );
    return '';
  }
}
