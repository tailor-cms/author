import type { Model, ModelStatic, Optional } from 'sequelize';

export interface EmojiAttrs {
  id: number;
  // The shortcode without its colons: `party`, written `:party:`.
  name: string;
  // Truncated SHA-256 of the encoded image, which the URL is built from.
  contentHash: string;
  isAnimated: boolean;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
}

type GeneratedAttrs = 'id' | 'isAnimated' | 'createdAt' | 'updatedAt';

export type Emoji = EmojiAttrs &
  Model<EmojiAttrs, Optional<EmojiAttrs, GeneratedAttrs>>;

declare const Emoji: ModelStatic<Emoji>;
export default Emoji;
