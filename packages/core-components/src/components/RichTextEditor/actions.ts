export enum Command {
  ToggleBold = 'toggleBold',
  ToggleItalic = 'toggleItalic',
  ToggleUnderline = 'toggleUnderline',
  ToggleStrike = 'toggleStrike',
  ToggleBulletList = 'toggleBulletList',
  ToggleOrderedList = 'toggleOrderedList',
  ToggleSubscript = 'toggleSubscript',
  ToggleSuperscript = 'toggleSuperscript',
  ToggleBlockquote = 'toggleBlockquote',
  ToggleCodeBlock = 'toggleCodeBlock',
}

export const actions = [
  [
    {
      name: 'bold',
      icon: 'mdi-format-bold',
      command: Command.ToggleBold,
    },
    {
      name: 'italic',
      icon: 'mdi-format-italic',
      command: Command.ToggleItalic,
    },
    {
      name: 'underline',
      icon: 'mdi-format-underline',
      command: Command.ToggleUnderline,
    },
    {
      name: 'strike',
      icon: 'mdi-format-strikethrough-variant',
      command: Command.ToggleStrike,
    },
  ],
  [
    {
      name: 'bulletList',
      icon: 'mdi-format-list-bulleted',
      command: Command.ToggleBulletList,
    },
    {
      name: 'orderedList',
      icon: 'mdi-format-list-numbered',
      command: Command.ToggleOrderedList,
    },
  ],
  [
    {
      name: 'subscript',
      icon: 'mdi-format-subscript',
      command: Command.ToggleSubscript,
    },
    {
      name: 'superscript',
      icon: 'mdi-format-superscript',
      command: Command.ToggleSuperscript,
    },
  ],
  [
    {
      name: 'blockquote',
      icon: 'mdi-format-quote-open',
      command: Command.ToggleBlockquote,
    },
    {
      name: 'codeBlock',
      icon: 'mdi-code-tags',
      command: Command.ToggleCodeBlock,
    },
  ],
];
