import * as yup from 'yup';

const serviceSchema = yup.object().shape({
  apiKey: yup.string().default(''),
  apiUrl: yup.string().url().required(),
  timeout: yup.number().positive().integer().default(10000),
});

function validate(config, label) {
  try {
    return serviceSchema.validateSync(config, { stripUnknown: true });
  } catch (err) {
    throw new Error(`Invalid discovery config [${label}]: ${err.message}`);
  }
}

const serperRaw = validate({
  apiKey: process.env.SERPER_API_KEY,
  apiUrl: process.env.SERPER_API_URL || 'https://google.serper.dev',
  timeout: Number(process.env.SERPER_TIMEOUT) || 10000,
}, 'serper');

export const serper = {
  ...serperRaw,
  isEnabled: !!serperRaw.apiKey,
};

const unsplashRaw = validate({
  apiKey: process.env.UNSPLASH_ACCESS_KEY,
  apiUrl: process.env.UNSPLASH_API_URL || 'https://api.unsplash.com',
  timeout: Number(process.env.UNSPLASH_TIMEOUT) || 10000,
}, 'unsplash');

export const unsplash = {
  accessKey: unsplashRaw.apiKey,
  apiUrl: unsplashRaw.apiUrl,
  timeout: unsplashRaw.timeout,
  isEnabled: !!unsplashRaw.apiKey,
};
