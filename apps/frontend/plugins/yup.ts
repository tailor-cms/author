import { addMethod, setLocale, string } from 'yup';
import capitalize from 'lodash/capitalize';
import { email } from '@vee-validate/rules';
import lowerCase from 'lodash/lowerCase';

const sentenceCase = (value: string) => capitalize(lowerCase(value));

export default defineNuxtPlugin(() => {
  setLocale({
    mixed: {
      default: ({ path }) => `${sentenceCase(path)} is invalid`,
      required: ({ path }) => `${sentenceCase(path)} is a required field`,
    },
    string: {
      min: ({ path, min }) =>
        `${sentenceCase(path)} must be at least ${min} characters`,
      max: ({ path, max }) =>
        `${sentenceCase(path)} must be at most ${max} characters`,
    },
  });

  addMethod(string, 'email', function () {
    return this.test(
      'is-email',
      ({ path }) => `${sentenceCase(path)} must be a valid email`,
      email,
    );
  });
});
