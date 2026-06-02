/**
 * DEFAULT (page) is the simplest container template: a flat
 * holder of content elements with no template-specific
 * behavior. Publishing/resolving fall back to the default
 * handlers in ActivityContainers.js, so this package only
 * needs to declare the template's structural shape via
 * describeSchema.
 */
function describeSchema(container) {
  return {
    subcontainers: [],
    elementConfig: container?.contentElementConfig || null,
  };
}

export default {
  templateId: 'DEFAULT',
  version: '1.0',
  describeSchema,
};
