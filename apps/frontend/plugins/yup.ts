import { addMethod, setLocale, string } from 'yup';
import capitalize from 'lodash/capitalize';
import { email } from '@vee-validate/rules';
import lowerCase from 'lodash/lowerCase';

const sentanceCase = (value: string) => capitalize(lowerCase(value));

export default defineNuxtPlugin(() => {
  setLocale({
    mixed: {
      default: ({ path }) => `${sentanceCase(path)} is invalid`,
      required: ({ path }) => `${sentanceCase(path)} is a required field`,
    },
    string: {
      min: ({ path, min }) =>
        `${sentanceCase(path)} must be at least ${min} characters`,
      max: ({ path, max }) =>
        `${sentanceCase(path)} must be at most ${max} characters`,
    },
  });

  addMethod(string, 'email', function validateEmail(message) {
    const defaultMsg = ({ path }: any) =>
      `${sentanceCase(path)} must be a valid email`;
    return this.test({
      message: message || defaultMsg,
      test: email,
    });
  });
});
