// Headless-browser sandbox for running and checking AI-written HTML pages.
export { BrowserUnavailableError } from './BrowserPool.ts';
export { bundlePage, type BundleResult, unbundlePage } from './bundle.ts';
export {
  DEFAULT_SETTLE_MS,
  DEFAULT_VIEWPORT,
  inspectPage,
  type InspectOptions,
  type InspectReport,
  MAX_SCREENSHOTS,
  MAX_SETTLE_MS,
  type PageIssue,
  type PageMetrics,
  type Screenshot,
  type Viewport,
} from './inspect.ts';
export { CDN_HOSTS } from './network.ts';
export {
  type Interaction,
  INTERACTION_ACTIONS,
  type InteractionResult,
  MAX_INTERACTIONS,
  MAX_WAIT_MS,
} from './interactions.ts';
