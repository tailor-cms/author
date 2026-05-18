import yn from 'yn';

export const isSeedApiEnabled = yn(process.env.ENABLE_TEST_API_ENDPOINTS);
