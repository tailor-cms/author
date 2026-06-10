import { api } from './typed-client';

// Exposed to content-element / content-container extensions via the
// `$api` injection in plugins/core-services.ts.
export const exposedApi = {
  fetchRepositories: (params) => api.repository.list({ query: params }),
  fetchActivities: (repositoryId, params) =>
    api.activity.list({ params: { repositoryId }, query: params }),
  fetchContentElements: (repositoryId, params) =>
    api.contentElement.list({ params: { repositoryId }, query: params }),
};

// Legacy asset modules; the api exposes asset routes at
// /assets/* (missing the /repositories/{repositoryId} prefix), so the
// typed client can't reach them.
export { default as asset } from './asset';
export { default as repositoryAsset } from './repositoryAsset';
// AI module also kept; agent routes share the same prefix problem.
export { default as ai } from './ai';

export { default as client } from './request';
export { api, apiClient } from './typed-client';

export default api;
