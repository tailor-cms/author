import { createLogger } from '#logger';

const SEPARATOR = '-'.repeat(60);

export const formatPrompt = (input: any[]) => {
  const sections = input.map((item: any) => {
    const role = (item.role || 'unknown').toUpperCase();
    const content = Array.isArray(item.content)
      ? item.content
          .map((p: any) => (p.type === 'text' ? p.text : `[${p.type}]`))
          .join('\n')
      : item.content || '';
    return `${SEPARATOR}\n[${role}]\n${SEPARATOR}\n${content}`;
  });
  return `\n${sections.join('\n\n')}\n${SEPARATOR}`;
};

export const createAiLogger = (name: string) => createLogger(`ai:${name}`);
