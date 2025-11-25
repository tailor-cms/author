import { sentenceCase } from '@tailor-cms/utils';
import { configure, defineRule } from 'vee-validate';
import { all } from '@vee-validate/rules';
import en from '@vee-validate/i18n/dist/locale/en.json';
import { localize } from '@vee-validate/i18n';

export default defineNuxtPlugin(() => {
  Object.entries(all).forEach(([name, rule]) => {
    defineRule(name, rule);
  });

  defineRule('decimal', (value: any, [decimals = '*', separator = '.']) => {
    // null and undefined are valid values, should be handled by required rule
    if (value === null || value === undefined) return true;
    const msg = 'This field must contain only decimal values';
    if (value === '') return msg;
    const regexPart = decimals === '*' ? '+' : `{1,${decimals}}`;
    const regex = new RegExp(
      `^[-+]?\\d*(\\${separator}\\d${regexPart})?([eE]{1}[-]?\\d+)?$`,
    );
    return regex.test(value) || msg;
  });

  defineRule('ext', (value: any, extensions: string[]) => {
    // null and undefined are valid values, should be handled by required rule
    if (value === null || value === undefined || value === '') return true;
    // File input values are objects with key and name properties
    const fileName = typeof value === 'string' ? value : value?.name;
    if (!fileName) return true;
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    const allowedExts = extensions.map((ext) => ext.toLowerCase());
    return (
      allowedExts.includes(fileExt) ||
      `File must have one of the following extensions: ${extensions.join(', ')}`
    );
  });

  configure({
    validateOnModelUpdate: false,
    // TODO: messages have been modified to align with yup messages
    // revisit once global validation strategy is finalized
    generateMessage: localize({
      en: {
        messages: {
          ...en.messages,
          required: ({ field }) => `${sentenceCase(field)} is a required field`,
          min: ({ field, rule }) => {
            const label = sentenceCase(field);
            const min = (rule?.params as any[])[0];
            return `${label} must be at least ${min} characters`;
          },
          max: ({ field, rule }) => {
            const label = sentenceCase(field);
            const max = (rule?.params as any[])[0];
            return `${label} must be at most ${max} characters`;
          },
        },
      },
    }),
  });
});
