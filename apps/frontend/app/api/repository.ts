import type {
  Repository,
  RepositoryQueryParams,
} from '@tailor-cms/interfaces/repository';
import type { AxiosRequestConfig } from 'axios';
import { extractData } from './helpers';
import request from './request';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import type { Activity } from '@tailor-cms/interfaces/activity';

interface References {
  activities: Activity[];
  elements: ContentElement[];
}

const urls = {
  root: '/repositories',
  import: () => `${urls.root}/import`,
  resource: (id: number) => `${urls.root}/${id}`,
  clone: (id: number) => `${urls.resource(id)}/clone`,
  validateReferences: (id: number) => `${urls.resource(id)}/references/validate`,
  cleanupReferences: (id: number) => `${urls.resource(id)}/references/cleanup`,
  pin: (id: number) => `${urls.resource(id)}/pin`,
  publish: (id: number) => `${urls.resource(id)}/publish`,
  exportInit: (id: number) => `${urls.resource(id)}/export/setup`,
  export: (id: number, jobId: string) => `${urls.resource(id)}/export/${jobId}`,
  exportStatus: (id: number, jobId: string) => `${urls.export(id, jobId)}/status`,
  users: (id: number, userId?: number) => `${urls.resource(id)}/users/${userId ?? ''}`,
  tags: (id: number, tagId?: number) => `${urls.resource(id)}/tags/${tagId ?? ''}`,
  userGroup: (id: number, userGroupId?: number) =>
    `${urls.resource(id)}/user-group/${userGroupId ?? ''}`,
};

function get(repositoryId: number, params?: any) {
  return request.get(urls.resource(repositoryId), { params }).then(extractData);
}

function getRepositories(params: Partial<RepositoryQueryParams>) {
  return request.get(urls.root, { params }).then(({ data }) => data);
}

function create(repository: {
  schema: string;
  name: string;
  description: string;
  userGroupIds: number[];
  data: Record<string, any>;
}) {
  return request.post(urls.root, repository).then(extractData);
}

function patch(repositoryId: number, data: Partial<Repository>) {
  return request.patch(urls.resource(repositoryId), data).then(extractData);
}

function remove(repositoryId: number) {
  return request.delete(urls.resource(repositoryId));
}

function clone(repositoryId: number, name: string, description: string) {
  return request
    .post(urls.clone(repositoryId), { name, description })
    .then(extractData);
}

function validateReferences(repositoryId: number): Promise<References> {
  return request
    .get(urls.validateReferences(repositoryId))
    .then(extractData);
}

function cleanupReferences(repositoryId: number, data: References) {
  return request
    .post(urls.cleanupReferences(repositoryId), data)
    .then(extractData);
}

function pin(repositoryId: number, pin: boolean) {
  return request.post(urls.pin(repositoryId), { pin }).then(extractData);
}

function getUsers(repositoryId: number) {
  return request.get(urls.users(repositoryId)).then(extractData);
}

function upsertUser(
  repositoryId: number,
  data: { email: string; role: string },
) {
  return request
    .post(urls.users(repositoryId), data)
    .then((res) => extractData(res).user);
}

function removeUser(repositoryId: number, userId: number) {
  return request
    .delete(urls.users(repositoryId, userId))
    .then((res) => res.data);
}

function publishRepositoryMeta(id: number) {
  return request.post(urls.publish(id)).then((res) => res.data);
}

function addTag(
  { name, repositoryId }: { name: string; repositoryId: number },
) {
  return request
    .post(urls.tags(repositoryId), { repositoryId, name })
    .then(extractData);
}

function removeTag(
  { repositoryId, tagId }: { repositoryId: number; tagId: number },
) {
  return request.delete(urls.tags(repositoryId, tagId)).then(extractData);
}

function addUserGroup(
  { repositoryId, userGroupId }: { repositoryId: number; userGroupId: number },
) {
  return request
    .post(urls.userGroup(repositoryId), { userGroupId })
    .then(extractData);
}

function removeUserGroup(
  { repositoryId, userGroupId }: { repositoryId: number; userGroupId: number },
) {
  return request
    .delete(urls.userGroup(repositoryId, userGroupId))
    .then(extractData);
}

function initiateExportJob(repositoryId: number) {
  return request.get(urls.exportInit(repositoryId)).then(extractData);
}

function getExportJobStatus(repositoryId: number, jobId: string) {
  return request.get(urls.exportStatus(repositoryId, jobId)).then(extractData);
}

function exportRepository(
  repositoryId: number,
  jobId: string,
  fields?: Record<string, any>,
) {
  return request.submitForm(urls.export(repositoryId, jobId), fields);
}

function importRepository(
  data: FormData,
  options: AxiosRequestConfig<FormData>,
) {
  return request.post(urls.import(), data, options);
}

export default {
  get,
  getRepositories,
  create,
  patch,
  remove,
  getUsers,
  upsertUser,
  removeUser,
  addUserGroup,
  removeUserGroup,
  clone,
  pin,
  publishRepositoryMeta,
  addTag,
  removeTag,
  initiateExportJob,
  getExportJobStatus,
  exportRepository,
  importRepository,
  validateReferences,
  cleanupReferences,
};
