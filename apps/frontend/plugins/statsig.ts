import { StatsigClient } from '@statsig/js-client';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('statsigInit', async (sdkSecret: string, userID: string) => {
    if (!sdkSecret || !userID) return null;
    const client = new StatsigClient(sdkSecret, { userID });
    await client.initializeAsync();
    return client;
  });
});
