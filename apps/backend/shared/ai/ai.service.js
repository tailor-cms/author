import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import isString from 'lodash/isString.js';
import OpenAI from 'openai';
import { schema as schemaConfig } from '@tailor-cms/config';
import shuffle from 'lodash/shuffle.js';
import { v4 as uuidv4 } from 'uuid';
import pick from 'lodash/pick.js';
import StorageService from '../storage/storage.service.js';

import { createLogger } from '#logger';
import { ai as aiConfig } from '#config';

const logger = createLogger('ai');
const {
  getLevel,
  getOutlineLevels,
  getSchema,
  getSchemaId,
  getSupportedContainers,
} = schemaConfig;

const parseResponse = (val) => {
  const content = val?.choices?.[0]?.message?.content;
  logger.info('Response content', content);
  try {
    if (!isString(content)) return content;
    return JSON.parse(content);
  } catch {
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
    const structureDesc =
      desc + withoutRecursion?.map((it) => generateTaxonDesc(it)).join(' ');
    const nodeDesc = outlineLevels
      .map((it) => (it?.ai?.definition || '').trim())
      .join(' ');
    return `${structureDesc.trim()} ${nodeDesc.trim()}`;
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
  Asistant is a bot desinged to help users to create content for
  Courses, Q&A content, Knowledge base, etc.

  Rules:
  - Use the User rules to generate the content
  - Generated content should have a friendly tone and be easy to understand
  - Generated content should not include any offensive language or content
  - Only return JSON objects`;

const tagFormattingPrompt = `
  Return response as JSON and use the following format:
  { tags: ['Example tag a', 'Example tag b', 'Example tag c'] }.
  The response should not include more than 15 tags. Each tag should be in
  human readable format and should not exceed 30 characters.`;

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
    if (!schemaId || !repositoryName || !repositoryDescription) return '';
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
      In order for you to help, is there any ambiguity in the topic that
      I should be aware of? Present any specificators or requirements that I
      should consider in form of tags.
      ${tagFormattingPrompt}`;
    const response = await this.requestCompletion(userPrompt);
    // If no tags are provided, ask once again, temp solution
    if (!response?.tags?.length) return this.requestCompletion(userPrompt);
    return response;
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
      that can further help you in the future. Present options that I
      should consider in form of tags.
      ${tagFormattingPrompt}`;
    const response = await this.requestCompletion(userPrompt);
    // If no tags are provided, ask once again, temp solution
    if (!response?.tags?.length) return this.requestCompletion(userPrompt);
    return response;
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
      "${schema.name}" specified as: ${generateTaxonomyDesc(schemaId).trim()}
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

  async suggestContent({
    repositoryName,
    repositoryDescription,
    topic,
    outlineActivityType,
    containerType,
    location,
    level = 'medium',
  }) {
    const schemaId = getSchemaId(outlineActivityType);
    if (!schemaId) throw new Error('Schema not found');
    const containerConfig = getSupportedContainers(outlineActivityType).find(
      (it) => it.type === containerType,
    );
    if (!containerConfig) throw new Error('Container type not found');
    const introPrompt = this.baseRepositoryPrompt(
      schemaId,
      repositoryName,
      repositoryDescription,
    );
    const outputRules = containerConfig?.ai?.outputRules || {};
    if (outputRules.isAssessment) {
      return this.generateAssessmentsForTopic({
        topic,
        location,
        level,
        introPrompt,
        outputRules,
      });
    };
    const [htmlElements, imageElement] = await Promise.all([
      this.generateHTMLElementsForTopic({
        topic,
        location,
        level,
        introPrompt,
        outputRules,
      }),
      outputRules.useDalle
        ? this.generateImageElementForTopic({ introPrompt, topic, location })
        : Promise.resolve(null),
    ]);
    const [firstElement, ...restElements] = htmlElements;
    if (imageElement) restElements.push(imageElement);
    return [firstElement, ...shuffle(restElements)];
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

  async generateAssessmentsForTopic({
    topic,
    location,
    level,
    introPrompt = '',
    outputRules = {},
  }) {
    const promptEnd = outputRules?.prompt
      ? `The following rules should be followed: ${outputRules.prompt}`
      : '';
    const userPrompt = `
      ${introPrompt}
      Generate multiple choice question about the "${topic}".
      The content is located in the "${location}".
      The targeted audience expertese level is "${level}".
      Return the response as a JSON object such that you:
        - Use { elements: []} format; where each element is defined as
        { "question": "", "correct": [], "answers": [], "hint": "", "feedback": {} }
        where 'question' is the question prompt, 'answers' is an array of possible
        answers, 'correct' is an array of indexes of the correct answers (one or more
        answers can be correct), 'hint' is an optional hint for the correct
        solution, and 'feedback' is an object with feedback for each answer, using
        indexes as keys. Feedback is optional and should provide more information
        about the answers.
      ${promptEnd}`;
    const { elements = [] } = await this.requestCompletion(userPrompt);
    const assessments = elements.map((it) => {
      const uuid = uuidv4();
      return {
        type: ContentElementType.MultipleChoice,
        data: {
          ...pick(it, ['correct', 'answers', 'hint', 'feedback']),
          isGradable: true,
          embeds: {
            [uuid]: {
              id: uuid,
              data: { content: it.question },
              embedded: true,
              position: 1,
              type: ContentElementType.TiptapHtml,
            },
          },
          question: [uuid],
        },
      };
    });
    logger.info('Generated Assessment elements', assessments);
    return assessments;
  }

  async generateHTMLElementsForTopic({
    topic,
    location,
    level,
    introPrompt = '',
    outputRules = {},
  }) {
    const promptEnd = outputRules?.prompt
      ? `The following rules should be followed: ${outputRules.prompt}`
      : '';
    const userPrompt = `
      ${introPrompt}
      Generate content explaining the "${topic}".
      The content is located in the "${location}".
      The targeted audience expertese level is "${level}".
      Return the response as a JSON object such that you:
        - Use { elements: [{ "content": "" }] } format;
          where content is the text of the page.
        - Format the content as a HTML with suitable tags
      ${promptEnd}`;
    const { elements = [] } = await this.requestCompletion(userPrompt);
    const htmlElements = elements.map((it) => ({
      type: ContentElementType.TiptapHtml,
      data: { content: it.content },
    }));
    logger.info('Generated HTML elements', htmlElements);
    return htmlElements;
  }

  async generateImageElementForTopic({ topic, location, introPrompt = '' }) {
    const promptQuery = `
      ${introPrompt}
      I am generating content explaining the "${topic}".
      The page is located in the "${location}".
      Generate a DALL·E 3 prompt for the related topic that would
      generate appropriate image for the given context.
      Return the prompt as JSON respecting the following format:
      { 'prompt': '' }`;
    const { prompt: dallePrompt } = await this.requestCompletion(promptQuery);
    const imgUrl = await this.generateImage(dallePrompt);
    const imgInternalUrl = await StorageService.downloadToStorage(imgUrl);
    const imageElement = {
      type: 'IMAGE',
      data: {
        assets: { url: imgInternalUrl },
      },
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
    const url = new URL(data[0].url);
    return url;
  }
}

export default aiConfig.secretKey ? new AIService() : {};
