import { runStatsigAutoCapture } from '@statsig/web-analytics';
import { runStatsigSessionReplay } from '@statsig/session-replay';
import { StatsigClient } from '@statsig/js-client';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('statsigInit', async (sdkSecret: string, userID: string) => {
    if (!sdkSecret || !userID) return null;
    const client = new StatsigClient(sdkSecret, { userID });
    // Remove these lines if you dont want to use session replay
    // or web analytics
    runStatsigSessionReplay(client);
    runStatsigAutoCapture(client);
    await client.initializeAsync();
    return client;
  });
});
