// Wire shape for the password-reset mail trigger.
import { z } from 'zod';
import { User } from './entity.ts';

export const ForgotPasswordInput = z
  .object({ email: User.shape.email })
  .describe(`Mail a reset token to the supplied account email.`);

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInput>;
