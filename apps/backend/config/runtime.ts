const env = process.env;

export const isProduction: boolean = env.NODE_ENV === 'production';
