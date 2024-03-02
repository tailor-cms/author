import isString from 'lodash/isString.js';
import OpenAI from 'openai';
import { schema as schemaConfig } from 'tailor-config-shared';
import shuffle from 'lodash/shuffle.js';

import { ai as aiConfig } from '../../config/server/index.js';
import createLogger from '../logger.js';

const logger = createLogger('ai');
const { getOutlineLevels, getSchema, getLevel } = schemaConfig;

const parseResponse = (val) => {
  const content = val?.choices?.[0]?.message?.content;
  logger.info('Response content', content);
  try {
    if (!isString(content)) return content;
    return JSON.parse(content);
  } catch (e) {
    logger.info('Unable to parse response', content);
    throw new Error('Invalid AI response', content);
  }
};

// Generate a textual representation of the taxonomy for a given schema.
// Consider the following structure: In the root level there are modules and
// pages. Modules can contain other modules and pages. Pages hold the content.
// The following text should be generated:
// In the root level of the taxonomy, the following node types are available:
// Module, Page. Module contains the following sublevels: Module, Page.
// Page contains the content.
const generateTaxonomyDesc = (schemaId) => {
  const outlineLevels = getOutlineLevels(schemaId);
  if (!outlineLevels) throw new Error('Schema not found!');
  const generateTaxonDesc = (activityTypeConfig) => {
    const subLevels = activityTypeConfig.subLevels?.map(getLevel);
    if (!subLevels?.length) return '';
    const { label } = activityTypeConfig;
    const subLevelsLabel = subLevels.map(({ label }) => label).join(', ');
    const desc = `${label} contains the following sublevels: ${subLevelsLabel}.`;
    const withoutRecursion =
      subLevels?.filter((it) => it.type !== activityTypeConfig.type) || [];
    return (
      desc + withoutRecursion?.map((it) => generateTaxonDesc(it)).join(' ')
    );
  };
  const rootLevels = outlineLevels.filter((level) => level?.rootLevel);
  // TODO: Add content holder desc.
  return `
    In the root level of the taxonomy, the following node types are available:
    ${rootLevels.map((level) => level.label).join(', ')}.
    ${rootLevels.map(generateTaxonDesc).join(' ')}
  `;
};

const systemPrompt = `
  Asistant is a bot desinged to help users to create content structures like
  courses, lessons, articles.

  Rules:
  - Use the User rules to generate the content
  - Generated content should have a friendly tone and be easy to understand
  - Generated content should not include any offensive language or content
  - Only return JSON objects`;

class AIService {
  #openai;

  constructor() {
    this.#openai = new OpenAI({
      apiKey: aiConfig.secretKey,
    });
  }

  baseRepositoryPrompt(
    schemaId,
    repositoryName,
    repositoryDescription,
    tags = [],
  ) {
    const schema = getSchema(schemaId);
    if (!schema) throw new Error('Schema not found');
    const prompt = `
      I'm trying to create a new "${schema.name}" named "${repositoryName}".
      It will be about: "${repositoryDescription}".`;
    if (tags.length === 0) return prompt;
    return `
      ${prompt} The following tags were provided to specify the context:
      ${tags.join(', ')}.`;
  }

  async resolveAmbiguity(schemaId, repoName, repoDescription) {
    const schema = getSchema(schemaId);
    if (!schema) throw new Error('Schema not found');
    const userPrompt = `
      ${this.baseRepositoryPrompt(schemaId, repoName, repoDescription)}
      In order for you to help, is there any ambiguity in the request that
      I should be aware of? Present any specificators or requirements that I
      should consider in form of tags. Return response as JSON and use the
      following format:
      ['tag1', 'tag2', 'tag3'].
      The response should not include more than 15 tags, and each tag should
      not exceed 20 characters.`;
    return this.requestCompletion(userPrompt);
  }

  async getTopicStyleRecommendations(
    schemaId,
    repoName,
    repoDescription,
    tags,
  ) {
    const userPrompt = `
      ${this.baseRepositoryPrompt(schemaId, repoName, repoDescription, tags)}
      I would like to get some style / school-of-thought based recommendations
      that can further help you in the future. Return response as JSON in form
      of tags and use the following format:
      ['tag1', 'tag2', 'tag3'].
    `;
    return this.requestCompletion(userPrompt);
  }

  async suggestOutline(
    schemaId,
    repoName,
    repoDescription,
    tags = [],
    level = 'medium',
  ) {
    const schema = getSchema(schemaId);
    if (!schema) throw new Error('Schema not found');
    const leafLevels = getOutlineLevels(schemaId).filter(
      (it) => it?.contentContainers?.length,
    );
    const userPrompt = `
      ${this.baseRepositoryPrompt(schemaId, repoName, repoDescription, tags)}
      Can you generate a structure/outline for this content.
      The structure should be created by following the taxonomy of the
      "${schema.name}" specified as: ${generateTaxonomyDesc(schemaId)}
      The targeted audience expertese level is ${level}.
      Return the response as a JSON object with the following format:
      { "name": "", "type": "", children: [] }
      where type indicates one of the taxonomy node types and children is an
      array of the same format. If possible, generate at least 10 root nodes.
      Make sure to have content holder nodes in the structure. The content
      holder nodes are the following:
      ${leafLevels.map((it) => it.label).join(', ')}.`;
    return this.requestCompletion(userPrompt);
  }

  async suggestContent(
    schemaId,
    repositoryName,
    repositoryDescription,
    topic,
    location,
    level = 'medium',
  ) {
    const [htmlElements, imageElement] = await Promise.all([
      this.generateHTMLElementsForTopic(
        schemaId,
        repositoryName,
        repositoryDescription,
        topic,
        location,
        level,
      ),
      this.generateImageElementForTopic(
        schemaId,
        repositoryName,
        repositoryDescription,
        topic,
        location,
      ),
    ]);
    const [firstElement, ...restElements] = htmlElements;
    return [firstElement, ...shuffle([...restElements, imageElement])];
  }

  async requestCompletion(prompt) {
    logger.info('Completion request', prompt);
    const completion = await this.#openai.chat.completions.create({
      model: aiConfig.modelId,
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });
    logger.info('Completion response', completion);
    return parseResponse(completion);
  }

  async generateHTMLElementsForTopic(
    schemaId,
    repositoryName,
    repositoryDesc,
    topic,
    location,
    level,
  ) {
    const schema = getSchema(schemaId);
    const userPrompt = `
      ${this.baseRepositoryPrompt(schemaId, repositoryName, repositoryDesc)}
      Generate a page of content explaining the "${topic}".
      The page is located in the "${location}" section of the "${schema.name}".
      The targeted audience expertese level is "${level}".
      Return the response as a JSON object such that you:
        - Use { elements: [{ "content": "" }] } format;
          where content is the text of the page.
        - Split the content contextually to couple of { "content": "" } blocks
          based on the context. Headings might be a good place to split.
          Dont include more than 3 headings.
        - Use at least 1000 words and don't exceed 2000 words.
        - Format the content as a HTML with suitable tags and headings.
        - Apply the folllowing classes to the tags:
          - Apply text-body-2 mb-5 to the paragraphs
          - Apply text-h3 and mb-7 to the headings
      You are trying to teach the audience, so make sure the content is easy to
      understand, has a friendly tone and is engaging to the reader.
      Make sure to include the latest relevant information on the topic.`;
    const { elements = [] } = await this.requestCompletion(userPrompt);
    const htmlElements = elements.map((it) => ({
      type: 'CE_HTML_DEFAULT',
      data: { content: it.content },
    }));
    logger.info('Generated HTML elements', htmlElements);
    return htmlElements;
  }

  async generateImageElementForTopic(
    schemaId,
    repositoryName,
    repositoryDescription,
    topic,
    location,
  ) {
    const schema = getSchema(schemaId);
    const promptQuery = `
      ${this.baseRepositoryPrompt(
        schemaId,
        repositoryName,
        repositoryDescription,
      )}
      I am generating content explaining the "${topic}".
      The page is located in the "${location}" of the "${schema.name}".
      Generate a DALL·E 3 prompt for the related topic that would
      generate appropriate image for the given context.
      Return the prompt as JSON respecting the following format:
      { 'prompt': '' }`;
    const { prompt: dallePrompt } = await this.requestCompletion(promptQuery);
    logger.info('DALL·E 3 prompt', dallePrompt);
    const url = await this.generateImage(dallePrompt);
    const imageElement = {
      type: 'CE_IMAGE',
      data: { url },
    };
    logger.info('Generated image element', imageElement);
    return imageElement;
  }

  async generateImage(prompt) {
    const { data } = await this.#openai.images.generate({
      prompt,
      model: 'dall-e-3',
      n: 1, // amount of images, max 1 for dall-e-3
      quality: 'hd', // 'standard' | 'hd',
      size: '1024x1024',
      style: 'natural',
    });
    return data[0].url;
  }
}

export default new AIService();
