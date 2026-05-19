// Wire-shape contracts for the User slice.
// Single source of truth: actions register these on `defineAction`, the
// service types its parameters via `z.infer`.
import { z } from 'zod';
import { UserRole } from '@tailor-cms/interfaces/role';

import {
  Email,
  IntParam,
  QueryBoolean,
  ShortText,
} from '#shared/request/schemas.ts';

// GET /users
export const ListQuery = z.object({
  // Substring match across email, firstName, lastName
  filter: z.string().trim().max(250).optional(),
  // Exact email match
  // Deliberately NOT validated as a full email address: a
  // search probe with a malformed value should return zero rows
  email: z.string().trim().max(250).optional(),
  // Restrict to a specific user role.
  role: z.enum(UserRole).optional(),
  // Include soft-deleted (archived) users in the result.
  archived: QueryBoolean.optional(),
  // Pagination and sorting
  offset: IntParam().optional(),
  limit: IntParam().optional(),
  sortBy: z.string().max(64).optional(),
  sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional(),
});

export type ListQuery = z.infer<typeof ListQuery>;

// POST /users/login
export const LoginBody = z.object({
  email: Email(),
  password: z.string().min(1),
});

export type LoginBody = z.infer<typeof LoginBody>;

// POST /users/forgot-password
export const ForgotPasswordBody = z.object({
  email: Email(),
});

export type ForgotPasswordBody = z.infer<typeof ForgotPasswordBody>;

// POST /users/reset-password
export const ResetPasswordBody = z.object({
  // 5..100 mirrors the User model's column-level length validator.
  password: z.string().min(5).max(100),
  // The reset token rides along in the body so the auth strategy can
  // pick it up; we accept it here only to keep the schema honest about
  // the wire shape.
  token: z.string().optional(),
});

export type ResetPasswordBody = z.infer<typeof ResetPasswordBody>;

// POST /users/reset-password/token-status
export const TokenStatusBody = z.object({
  token: z.string(),
});

export type TokenStatusBody = z.infer<typeof TokenStatusBody>;

// POST /users
export const UpsertBody = z.object({
  // Account email. Trimmed + lower-cased; doubles as the upsert key.
  email: Email(),
  // Optional first name (2..50 chars to match the DB validator).
  firstName: ShortText(2, 50).optional(),
  // Optional last name.
  lastName: ShortText(2, 50).optional(),
  // System-level role.
  // `defaultValue: COLLABORATOR`.
  role: z.enum(UserRole).optional(),
  // Replace the user's user-group memberships with this exact set.
  // Omit to leave memberships untouched.
  userGroupIds: z.array(z.number().int()).optional(),
  // Suppress the invitation email on create. No effect on update.
  skipInvite: z.boolean().optional(),
});

export type UpsertBody = z.infer<typeof UpsertBody>;

// DELETE /users/:id
export const RemoveParams = z.object({
  id: IntParam(),
});

export type RemoveParams = z.infer<typeof RemoveParams>;

// POST /users/:id/reinvite
export const ReinviteParams = z.object({
  id: IntParam(),
});

export type ReinviteParams = z.infer<typeof ReinviteParams>;

// PATCH /users/me
export const ProfileUpdateBody = z.object({
  email: Email().optional(),
  firstName: ShortText(2, 50).optional(),
  lastName: ShortText(2, 50).optional(),
  // Generous ceiling: the FE sends a base64 data URL for the avatar
  // (250x250 compressed JPEG via the Avatar component). 200_000 chars
  // covers any reasonable upload while gating obvious DoS payloads.
  imgUrl: z.string().max(200_000).optional(),
});

export type ProfileUpdateBody = z.infer<typeof ProfileUpdateBody>;

// POST /users/me/change-password
export const ChangePasswordBody = z.object({
  // No length floor: existing accounts may have any length the model allowed
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

export type ChangePasswordBody = z.infer<typeof ChangePasswordBody>;
