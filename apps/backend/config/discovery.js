import * as yup from 'yup';

const apiServiceSchema = yup.object().shape({
  apiKey: yup.string().default(''),
  apiUrl: yup.string().url().required(),
  timeout: yup.number().positive().integer().default(10000),
});

const jinaServiceSchema = yup.object().shape({
  apiUrl: yup.string().url().required(),
  timeout: yup.number().positive().integer().default(15000),
});

function validate(schema, config, label) {
  try {
    return schema.validateSync(config, { stripUnknown: true });
  } catch (err) {
    throw new Error(`Invalid discovery config [${label}]: ${err.message}`);
  }
}

const serperRaw = validate(
  apiServiceSchema,
  {
    apiKey: process.env.SERPER_API_KEY,
    apiUrl: process.env.SERPER_API_URL || 'https://google.serper.dev',
    timeout: Number(process.env.SERPER_TIMEOUT) || 10000,
  },
  'serper',
);

export const serper = {
  ...serperRaw,
  isEnabled: !!serperRaw.apiKey,
};

const unsplashRaw = validate(
  apiServiceSchema,
  {
    apiKey: process.env.UNSPLASH_ACCESS_KEY,
    apiUrl: process.env.UNSPLASH_API_URL || 'https://api.unsplash.com',
    timeout: Number(process.env.UNSPLASH_TIMEOUT) || 10000,
  },
  'unsplash',
);

export const unsplash = {
  accessKey: unsplashRaw.apiKey,
  apiUrl: unsplashRaw.apiUrl,
  timeout: unsplashRaw.timeout,
  isEnabled: !!unsplashRaw.apiKey,
};

export const jina = validate(
  jinaServiceSchema,
  {
    apiUrl: process.env.JINA_READER_URL || 'https://r.jina.ai',
    timeout: Number(process.env.JINA_READER_TIMEOUT) || 15000,
  },
  'jina',
);

const ogsSchema = yup.object().shape({
  timeout: yup.number().positive().integer().default(5000),
});

export const ogs = validate(
  ogsSchema,
  { timeout: Number(process.env.OGS_TIMEOUT) || 5000 },
  'ogs',
);
