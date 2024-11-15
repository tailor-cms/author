import find from 'lodash/find.js';

import validateWorkflow from './workflow-validation';

const priorities = [
  {
    id: 'CRITICAL',
    label: 'Critical',
    icon: 'mdi-chevron-double-up',
    color: 'red',
  },
  { id: 'HIGH', label: 'High', icon: 'mdi-chevron-up', color: 'orange' },
  {
    id: 'MEDIUM',
    label: 'Medium',
    icon: 'mdi-minus',
    default: true,
    color: 'grey',
  },
  { id: 'LOW', label: 'Low', icon: 'mdi-chevron-down', color: 'green' },
  {
    id: 'TRIVIAL',
    label: 'Trivial',
    icon: 'mdi-chevron-double-down',
    color: 'blue',
  },
];

export default (workflows: any[], schemaApi) => {
  validateWorkflow(workflows);

  return {
    priorities,
    getWorkflow,
    getPriority,
    getDefaultWorkflowStatus,
    getDefaultActivityStatus,
  };

  function getWorkflow(id) {
    return find(workflows, { id });
  }

  function getPriority(id) {
    return find(priorities, { id });
  }

  function getDefaultWorkflowStatus(id) {
    const { statuses } = getWorkflow(id);
    const { id: status } = statuses.find((it) => it.default) || statuses[0];
    const { id: priority } = priorities.find((it) => it.default) as any;
    return { status, priority };
  }

  function getDefaultActivityStatus(type) {
    const schemaId = schemaApi.getSchemaId(type);
    if (!schemaId) return;
    const { workflowId } = schemaApi.getSchema(schemaId);
    if (!workflowId) return;
    return getDefaultWorkflowStatus(workflowId);
  }
};
