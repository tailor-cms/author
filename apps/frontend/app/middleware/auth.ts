import { StatsigClient } from '@statsig/js-client';

import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import { useEmojiStore } from '@/stores/emoji';

export default async function () {
  const isAuthenticated = useCookie('is-authenticated');
  const authStore = useAuthStore();
  if (authStore.user) return;
  await authStore.fetchUserInfo();
  isAuthenticated.value = authStore.user ? 'true' : null;
  if (!isAuthenticated.value) return navigateTo({ name: 'sign-in' });
  // Not awaited
  useEmojiStore().fetch().catch(() => undefined);
  await statsigInit();
}

const statsigInit = async () => {
  const authStore = useAuthStore();
  const config = useConfigStore();
  if (!config.props.statsigKey || !authStore.user?.email) return;
  const client = new StatsigClient(config.props.statsigKey, {
    userID: authStore.user?.email,
  });
  await client.initializeAsync();
  const dynamicConfig = client.getDynamicConfig('personalizedconfig');
  config.personalize(dynamicConfig);
};
