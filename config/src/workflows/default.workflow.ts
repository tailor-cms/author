export const DEFAULT_WORKFLOW = {
  id: 'DEFAULT_WORKFLOW',
  dueDateWarningThreshold: { days: 3 },
  statuses: [
    { id: 'TODO', label: 'Todo', default: true, color: '#6A7A8D' },
    { id: 'IN_PROGRESS', label: 'In progress', color: '#D39736' },
    { id: 'REVIEW', label: 'Review', color: '#8B64CD' },
    { id: 'DONE', label: 'Done', color: '#28A284' },
  ],
};
