import * as yup from 'yup';
import yn from 'yn';

function validate<T>(
  schema: yup.ObjectSchema<any>,
  config: unknown,
  label: string,
): T {
  try {
    return schema.validateSync(config, { stripUnknown: true }) as T;
  } catch (err) {
    throw new Error(
      `Invalid discovery config [${label}]: ${(err as Error).message}`,
    );
  }
}

export const isEnabled = yn(process.env.NUXT_PUBLIC_DISCOVERY_ENABLED);

interface ApiServiceConfig {
  apiUrl: string;
  apiKey: string;
  timeout: number;
}

const apiServiceSchema = yup.object().shape({
  apiUrl: yup.string().url().required(),
  apiKey: yup.string().default(''),
  timeout: yup.number().positive().integer().default(10000),
});

const serperBase = validate<ApiServiceConfig>(
  apiServiceSchema,
  {
    apiUrl: process.env.SERPER_API_URL || 'https://google.serper.dev',
    apiKey: process.env.SERPER_API_KEY,
    timeout: Number(process.env.SERPER_TIMEOUT) || 10000,
  },
  'serper',
);

export const serper = {
  ...serperBase,
  isEnabled: !!serperBase.apiKey,
};

const unsplashBase = validate<ApiServiceConfig>(
  apiServiceSchema,
  {
    apiUrl: process.env.UNSPLASH_API_URL || 'https://api.unsplash.com',
    apiKey: process.env.UNSPLASH_ACCESS_KEY,
    timeout: Number(process.env.UNSPLASH_TIMEOUT) || 10000,
  },
  'unsplash',
);

export const unsplash = {
  ...unsplashBase,
  isEnabled: !!unsplashBase.apiKey,
};

interface JinaConfig {
  apiUrl: string;
  timeout: number;
}

const jinaServiceSchema = yup.object().shape({
  apiUrl: yup.string().url().required(),
  timeout: yup.number().positive().integer().default(15000),
});

export const jina = validate<JinaConfig>(
  jinaServiceSchema,
  {
    apiUrl: process.env.JINA_READER_URL || 'https://r.jina.ai',
    timeout: Number(process.env.JINA_READER_TIMEOUT) || 15000,
  },
  'jina',
);

interface OgsConfig {
  timeout: number;
}

const ogsSchema = yup.object().shape({
  timeout: yup.number().positive().integer().default(5000),
});

export const ogs = validate<OgsConfig>(
  ogsSchema,
  { timeout: Number(process.env.OGS_TIMEOUT) || 5000 },
  'ogs',
);
