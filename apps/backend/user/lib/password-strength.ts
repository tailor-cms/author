import { zxcvbnAsync, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnCommon from '@zxcvbn-ts/language-common';
import * as zxcvbnEn from '@zxcvbn-ts/language-en';

import type { User } from '../models/user.model.js';

// zxcvbn scores passwords 0..4; 3 = "safely unguessable"
const MIN_PASSWORD_SCORE = 3;

zxcvbnOptions.setOptions({
  dictionary: {
    ...zxcvbnCommon.dictionary,
    ...zxcvbnEn.dictionary,
  },
  graphs: zxcvbnCommon.adjacencyGraphs,
  translations: zxcvbnEn.translations,
  useLevenshteinDistance: true,
});

// Thrown by `assertStrongPassword` when the score is below the threshold.
export class WeakPasswordError extends Error {
  constructor(feedback: { warning: string; suggestions: string[] }) {
    const phrase =
      feedback.warning || feedback.suggestions[0] || 'Password is too weak';
    super(phrase);
    this.name = 'WeakPasswordError';
  }
}

// Extracts the strings zxcvbn should treat as "known about the user".
function userInputsFor(user: User): string[] {
  const localPart = user.email.split('@')[0];
  return [user.email, localPart, user.firstName, user.lastName].filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  );
}

// Throws `WeakPasswordError` when the password scores below the threshold.
export async function assertStrongPassword(
  password: string,
  user: User,
): Promise<void> {
  const result = await zxcvbnAsync(password, userInputsFor(user));
  if (result.score >= MIN_PASSWORD_SCORE) return;
  throw new WeakPasswordError({
    warning: result.feedback.warning ?? '',
    suggestions: result.feedback.suggestions ?? [],
  });
}
