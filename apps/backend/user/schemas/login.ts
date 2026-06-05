// Wire shape for email + password login.
import { z } from 'zod';

import { User } from './entity.ts';

export const LoginInput = z
  .object({
    email: User.shape.email,
    password: z.string().min(1).describe('Account password.'),
  })
  .describe('Email + password login payload.');

export type LoginInput = z.infer<typeof LoginInput>;
