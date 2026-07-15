export const ISSUE_WORKFLOW = {
  id: 'ISSUE_WORKFLOW',
  dueDateWarningThreshold: { days: 3 },
  statuses: [
    { id: 'BACKLOG', label: 'Backlog', default: true, color: '#6A7A8D' },
    { id: 'TODO', label: 'Todo', color: '#4F5662' },
    { id: 'IN_PROGRESS', label: 'In progress', color: '#D39736' },
    { id: 'REVIEW', label: 'Review', color: '#8B64CD' },
    { id: 'DONE', label: 'Done', color: '#28A284', completed: true },
    { id: 'NOT_DOING', label: 'Not doing', color: '#D06A3F', completed: true },
  ],
};
