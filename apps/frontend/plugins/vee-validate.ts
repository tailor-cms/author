import { configure, defineRule } from 'vee-validate';
import { all } from '@vee-validate/rules';
import en from '@vee-validate/i18n/dist/locale/en.json';
import { localize } from '@vee-validate/i18n';

export default defineNuxtPlugin(() => {
  Object.entries(all).forEach(([name, rule]) => {
    defineRule(name, rule);
  });

  configure({
    validateOnModelUpdate: false,
    // TODO: messages have been modified to align with yup messages
    // revisit once global validation strategy is finalized
    generateMessage: localize({
      en: {
        messages: {
          ...en.messages,
          required: '{field} is a required field',
          min: '{field} must be at least 0:{length} characters',
          max: '{field} must be at most 0:{length} characters',
        },
      },
    }),
  });
});
