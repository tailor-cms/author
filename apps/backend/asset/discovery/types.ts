export {
  ContentFilter,
  ContentType,
  CONTENT_TYPES,
  type DiscoveryResult,
} from '@tailor-cms/interfaces/discovery.ts';

// Thrown when a search provider rejects with a quota/rate-limit error.
export class QuotaExceededError extends Error {
  constructor(provider: string) {
    super(`${provider} quota exceeded`);
    this.name = 'QuotaExceededError';
  }
}
