import capitalize from 'lodash/capitalize';
import lowerCase from 'lodash/lowerCase';
import { setLocale } from 'yup';

const sentanceCase = (value: string) => capitalize(lowerCase(value));

export default defineNuxtPlugin(() => {
  setLocale({
    mixed: {
      default: ({ path }) => `${sentanceCase(path)} is invalid`,
      required: ({ path }) => `${sentanceCase(path)} is a required field`,
    },
    string: {
      email: ({ path }) => `${sentanceCase(path)} must be a valid email`,
      min: ({ path, min }) =>
        `${sentanceCase(path)} must be at least ${min} characters`,
      max: ({ path, max }) =>
        `${sentanceCase(path)} must be at most ${max} characters`,
    },
  });
});
