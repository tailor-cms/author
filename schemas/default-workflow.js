export const DEFAULT_WORKFLOW = {
  id: 'DEFAULT_WORKFLOW',
  dueDateWarningThreshold: { days: 3 },
  statuses: [
    { id: 'TODO', label: 'Todo', default: true, color: 'blue' },
    { id: 'IN_PROGRESS', label: 'In progress', color: 'amber' },
    { id: 'REVIEW', label: 'Review', color: 'lime' },
    { id: 'DONE', label: 'Done', color: 'green' },
  ],
};
