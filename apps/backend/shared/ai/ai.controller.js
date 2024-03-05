import AIService from './ai.service.js';

async function resolveAmbiguity(req, res) {
  const { schemaId, name, description } = req.body;
  const data = await AIService.resolveAmbiguity(schemaId, name, description);
  res.json({ data });
}

async function getTopicStyleRecommendations(req, res) {
  const { schemaId, name, description, tags } = req.body;
  const data = await AIService.getTopicStyleRecommendations(
    schemaId,
    name,
    description,
    tags,
  );
  res.json({ data });
}

async function getTopicOutlineRecommendation(req, res) {
  const { schemaId, name, description, tags, level } = req.body;
  const data = await AIService.suggestOutline(
    schemaId,
    name,
    description,
    tags,
    level,
  );
  res.json({ data });
}

async function getContentSuggestion(req, res) {
  const {
    repositoryName,
    repositoryDescription,
    outlineActivityType,
    containerType,
    location,
    topic,
  } = req.body;
  const data = await AIService.suggestContent({
    repositoryName,
    repositoryDescription,
    outlineActivityType,
    containerType,
    topic,
    location,
  });
  res.json({ data });
}

export default {
  resolveAmbiguity,
  getTopicStyleRecommendations,
  getTopicOutlineRecommendation,
  getContentSuggestion,
};
