import yn from 'yn';

export const seedApiEnabled = yn(process.env.ENABLE_TEST_API_ENDPOINTS);
