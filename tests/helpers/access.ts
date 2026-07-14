import type { RepositoryMember } from '@tailor-cms/interfaces/repository';
import BaseClient from '../api/BaseClient';

// Path-based client for repository membership sub-resources
// (`/:id/users`), which ApiClient's id-keyed helpers can't address.
const client = new BaseClient('/api/repositories/');

/**
 * Removes a member from a repository so a non-admin loses visibility of it.
 * Runs through the admin API client (the affected user cannot self-revoke).
 */
export const revokeAccess = async (repositoryId: number, email: string) => {
  const { data: members } = await client.get(`${repositoryId}/users`);
  const member = members.find((it: RepositoryMember) => it.email === email);
  if (!member) {
    throw new Error(`No member ${email} on repository ${repositoryId}`);
  }
  await client.delete(`${repositoryId}/users/${member.id}`);
};
