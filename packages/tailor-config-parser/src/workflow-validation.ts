import * as yup from 'yup';

const workflowStatus = yup.object().shape({
  id: yup.string().required(),
  label: yup.string().required(),
  color: yup.string().required(),
  default: yup.boolean(),
});

const duration = yup.object().shape({
  months: yup.number(),
  weeks: yup.number(),
  days: yup.number(),
});

const workflow = yup.object().shape({
  id: yup.string().required(),
  statuses: yup.array().of(workflowStatus).min(1),
  dueDateWarningThreshold: duration,
});

const workflows = yup.array().of(workflow);

export default (config) => {
  try {
    workflows.validateSync(config);
  } catch (err) {
    console.error('Invalid workflow config!', err.message);
    throw err;
  }
};
