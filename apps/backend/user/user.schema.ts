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

// Slim user projection attached to records that include the author /
// uploader / assignee user (revisions, comments, activity-status,
// repository member rows, etc.). Mirrors `user.profile` from the model.
export const UserSummary = z.object({
  id: z.number().int().describe('User numeric id.'),
  email: Email().describe('User email (login key).'),
  firstName: z.string().nullable().describe('First name.'),
  lastName: z.string().nullable().describe('Last name.'),
  fullName: z.string().nullable().describe('Computed full name.'),
  label: z.string().describe('Display label fallback (full name or email).'),
  imgUrl: z.string().nullable().describe('Avatar URL.'),
}).meta({ id: 'UserSummary' })
  .describe('Slim user projection attached to records that include the user.');

export type UserSummary = z.infer<typeof UserSummary>;

// GET /users
export const ListFilter = z.object({
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

export type ListFilter = z.infer<typeof ListFilter>;

// POST /users/login
export const LoginInput = z.object({
  email: Email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof LoginInput>;

// POST /users/forgot-password
export const ForgotPasswordInput = z.object({
  email: Email(),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInput>;

// POST /users/reset-password
export const ResetPasswordInput = z.object({
  // 5..100 mirrors the User model's column-level length validator.
  password: z.string().min(5).max(100),
  // The reset token rides along in the body so the auth strategy can
  // pick it up; we accept it here only to keep the schema honest about
  // the wire shape.
  token: z.string().optional(),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordInput>;

// POST /users/reset-password/token-status
export const TokenStatusInput = z.object({
  token: z.string(),
});

export type TokenStatusInput = z.infer<typeof TokenStatusInput>;

// POST /users
export const UpsertInput = z.object({
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

export type UpsertInput = z.infer<typeof UpsertInput>;

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
export const ProfileUpdateInput = z.object({
  email: Email().optional(),
  firstName: ShortText(2, 50).optional(),
  lastName: ShortText(2, 50).optional(),
  // Generous ceiling: the FE sends a base64 data URL for the avatar
  // (250x250 compressed JPEG via the Avatar component). 200_000 chars
  // covers any reasonable upload while gating obvious DoS payloads.
  imgUrl: z.string().max(200_000).optional(),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateInput>;

// POST /users/me/change-password
export const ChangePasswordInput = z.object({
  // No length floor: existing accounts may have any length the model allowed
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordInput>;
