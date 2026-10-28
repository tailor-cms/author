import { Node } from '@tiptap/vue-3';
import { toEmojiShortcode } from '@tailor-cms/utils';

// A custom emoji, shown as its image and saved as its `:shortcode:`
export const CustomEmojiNode = Node.create({
  name: 'customEmoji',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes: () => ({
    name: { parseHTML: (el) => el.getAttribute('data-emoji') },
    url: { parseHTML: (el) => el.getAttribute('src') },
  }),
  parseHTML: () => [{ tag: 'img[data-emoji]' }],
  renderHTML: ({ node: { attrs } }) => [
    'img',
    {
      'class': 'composer-emoji',
      'src': attrs.url,
      'alt': toEmojiShortcode(attrs.name),
      'title': toEmojiShortcode(attrs.name),
      'data-emoji': attrs.name,
    },
  ],
  renderText: ({ node: { attrs } }) => toEmojiShortcode(attrs.name),
});
