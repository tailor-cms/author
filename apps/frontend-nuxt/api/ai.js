import { extractData } from './helpers';
import request from './request';

const urls = {
  root: () => '/ai',
  ambiguity: () => `${urls.root()}/ambiguity`,
  style: () => `${urls.root()}/style`,
  outline: () => `${urls.root()}/outline`,
  content: () => `${urls.root()}/content`,
};

function resolveAmbiguity(payload) {
  return request
    .post(urls.ambiguity(), payload)
    .then(extractData);
}

function getTopicStyleRecommendations(payload) {
  return request
    .post(urls.style(), payload)
    .then(extractData);
}


function getTopicOutlineRecommendation(payload) {
  return request
    .post(urls.outline(), payload)
    .then(extractData);
}

function getContentSuggestion(payload) {
  return request
    .post(urls.content(), payload)
    .then(extractData);
}

export default {
  resolveAmbiguity,
  getTopicStyleRecommendations,
  getTopicOutlineRecommendation,
  getContentSuggestion,
};
