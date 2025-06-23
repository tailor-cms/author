import { find } from 'lodash-es';

import validateWorkflow from './workflow-validation';

export interface WorkflowStatus {
  id: string;
  label: string;
  color: string;
  default?: boolean;
}

export interface WorkflowPriority {
  id: string;
  label: string;
  icon: string;
  color: string;
  default?: boolean;
}

interface DueDateTreshold {
  days?: number;
  months?: number;
  weeks?: number;
}

export interface Workflow {
  id: string;
  dueDateWarningThreshold?: DueDateTreshold;
  statuses: WorkflowStatus[];
}

const priorities: WorkflowPriority[] = [
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

export const getWorkflowApi = (workflows: Workflow[], schemaApi) => {
  validateWorkflow(workflows);

  return {
    priorities,
    getWorkflow,
    getPriority,
    getDefaultWorkflowStatus,
    getDefaultActivityStatus,
  };

  function getWorkflow(id): Workflow | undefined {
    return find(workflows, { id });
  }

  function getPriority(id): WorkflowPriority | undefined {
    return find(priorities, { id });
  }

  function getDefaultWorkflowStatus(id) {
    const workflow = getWorkflow(id);
    if (!workflow) return;
    const { statuses } = workflow;
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
