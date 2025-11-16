import { pick } from 'lodash-es';

const ATTRS = [
  'id',
  'uid',
  'type',
  'position',
  'parentId',
  'data',
  'createdAt',
  'updatedAt',
];

/**
 * Fetches a subcontainer with its content elements
 * @param {Activity} subcontainer - The subcontainer activity
 * @returns {Promise<Activity>} Subcontainer with elements
 */
async function fetchSubcontainer(subcontainer) {
  const elements = await subcontainer.getContentElements({ raw: true });
  return {
    ...pick(subcontainer, ATTRS),
    elements: elements.map((el, index) => ({ ...el, position: index + 1 })),
  };
}

/**
 * Fetches a container with all its subcontainers and their elements
 * @param {Activity} container - The main container activity
 * @param {Object} childOptions - Options for child elements
 * @returns {Promise<Activity>} Container with nested subcontainers and elements
 */
async function fetchContainer(container, childOptions) {
  const subcontainers = await container.getChildren({
    ...childOptions,
    order: [['position', 'ASC']],
  });
  // For each subcontainer, fetch its content elements
  const processedSubcontainers = await Promise.all(
    subcontainers.map(fetchSubcontainer),
  );
  return {
    ...pick(container, ATTRS),
    containers: processedSubcontainers,
  };
}

/**
 * Main fetch function called by the publishing system
 * @param {Activity} parent - The parent activity (e.g., LESSON)
 * @param {string} type - The container type (e.g., LESSON_CONTENT)
 * @param {Object} childOptions - Options including ContentElement model
 * @returns {Promise<Activity>} Array of containers with their nested structure
 */
function fetch(parent, type, childOptions) {
  const opts = { where: { type } };
  return parent
    .getChildren(opts)
    .map((container) => fetchContainer(container, childOptions));
}

/**
 * Resolve function to process static assets and apply hooks
 * @param {Object} container - The container with subcontainers
 * @param {Function} resolveStatics - Function to resolve static assets
 * @returns {Promise<Object>} Container with resolved assets
 */
async function resolve(container, resolveStatics) {
  // Process elements in each subcontainer
  if (container.containers?.length) {
    container.containers = await Promise.all(
      container.containers.map(async (subcontainer) => {
        if (subcontainer.elements?.length) {
          subcontainer.elements = await Promise.all(
            subcontainer.elements.map(resolveStatics),
          );
        }
        return subcontainer;
      }),
    );
  }
  return container;
}

export default {
  templateId: 'STRUCTURED_CONTENT',
  version: '1.0',
  fetch,
  resolve,
};
