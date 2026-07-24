import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { ElementManifest } from '@tailor-cms/interfaces/schema';

/**
 * Top-level elements render inside the unified card wrapper. Embeds (no
 * uid) keep the inline look.
 */
export const isCardElement = (
  element: ContentElement,
  manifest?: ElementManifest | null,
): boolean => !!manifest && !!element.uid;
