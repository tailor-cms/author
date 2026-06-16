<template>
  <VAppBar id="mainAppBar" class="app-bar elevation-0">
    <NuxtLink :to="{ name: 'catalog' }" class="app-brand ml-5">
      <img
        alt="Tailor logo"
        class="mr-4"
        src="/img/logo-new.svg"
        width="36"
      />
      <VAppBarTitle class="app-name" text="Tailor" />
    </NuxtLink>
    <div v-if="!smAndDown" class="d-flex ga-1 ml-5">
      <VBtn
        v-for="{ name, to } in topLevelRoutes"
        :key="name"
        :to="to"
        min-width="96"
        variant="text"
        rounded="lg"
      >
        <span class="toolbar-route text-truncate">{{ name }}</span>
      </VBtn>
    </div>
    <template #append>
      <div v-if="showRenoir" class="app-renoir d-flex align-center mr-2">
        <PanelLauncher :is-running="isAgentRunning" @open="openAgentPanel" />
      </div>
      <VMenu
        :close-on-content-click="false"
        attach="#mainAppBar"
        width="250"
        offset="10"
        transition="slide-y-transition"
      >
        <template #activator="{ props }">
          <UserAvatar
            v-bind="props"
            :img-url="user.imgUrl"
            aria-label="User menu"
            class="mx-4"
            tag="button"
          />
        </template>
        <VCard class="text-left">
          <VSheet
            color="surface-container"
            class="d-flex flex-column pa-6 align-center text-center"
          >
            <UserAvatar :img-url="user.imgUrl" size="x-large" />
            <div class="text-body-large font-weight-semibold mt-2">
              {{ user.label }}
            </div>
            <div v-if="user.fullName" class="text-body-small text-medium-emphasis">
              {{ user.email }}
            </div>
          </VSheet>
          <VList
            class="d-flex flex-column ga-1 pa-2"
            density="compact"
            slim
          >
            <template v-if="smAndDown">
              <VListItem
                v-for="{ name, to, icon } in routes"
                :key="name"
                :to="to"
                :title="name"
                :prepend-icon="icon"
                rounded="lg"
              />
            </template>
            <VListItem
              :to="{ name: 'user-profile' }"
              title="Profile"
              prepend-icon="mdi-account-circle-outline"
              rounded="lg"
            />
            <ThemeSwitcher submenu />
            <VListItem
              title="Logout"
              prepend-icon="mdi-logout"
              rounded="lg"
              @click="logout"
            />
          </VList>
        </VCard>
      </VMenu>
    </template>
  </VAppBar>
</template>

<script lang="ts" setup>
import { useDisplay } from 'vuetify';
import type { User } from '@tailor-cms/interfaces/user';
import { UserAvatar } from '@tailor-cms/core-components';
import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import { useCurrentRepository } from '@/stores/current-repository';
import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue';
import PanelLauncher from '@/components/common/AgentPanel/PanelLauncher.vue';

defineProps<{ user: User }>();

const { smAndDown } = useDisplay();

const { $oidc, $eventBus } = useNuxtApp() as any;
const config = useConfigStore();
const authStore = useAuthStore();
const currentRepositoryStore = useCurrentRepository();

// Renoir (agent launcher) lives in the app bar, but only within the
// repository workspace where the assistant has content to act on.
const showRenoir = computed(
  () => config.isAiAvailable && Boolean(currentRepositoryStore.repository),
);

const agentChannel = $eventBus.channel('agent');

// Mirrors the agent panel's run state (broadcast on the agent bus).
const isAgentRunning = ref(false);
const onRunState = ({ isRunning }: { isRunning: boolean }) => {
  isAgentRunning.value = isRunning;
};
const openAgentPanel = () => agentChannel.emit('panel:toggle');

onMounted(() => agentChannel.on('run:state', onRunState));
onBeforeUnmount(() => agentChannel.off('run:state', onRunState));
const topLevelRoutes = computed(() => {
  const items = [
    { name: 'Catalog', to: '/', icon: 'mdi-view-grid-plus-outline' },
    {
      name: 'Admin',
      to: {
        name: authStore.isAdmin ? 'system-user-management' : 'user-groups',
      },
      icon: 'mdi-account-cog-outline',
    },
  ];
  if (!authStore.hasAdminAccess) items.pop();
  return items;
});

const routes = computed(() => topLevelRoutes.value);

const logout = async () => {
  if (authStore.isOidcActive && config.props.oidcLogoutEnabled) {
    return $oidc.logout();
  }
  await authStore.logout();
  navigateTo('/auth');
};
</script>

<style lang="scss" scoped>
.app-bar {
  z-index: 10;

  .v-toolbar__content .v-btn.v-btn--icon {
    width: unset;
    height: unset;
  }
}

.app-brand {
  display: flex;
  align-items: center;
  text-decoration: none;
  cursor: pointer;

  .app-name {
    margin: 0 0 0 0.125rem;
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    line-height: 1.2;
    text-transform: uppercase;
    color: rgb(var(--v-theme-on-surface));
  }
}

.top-route {
  letter-spacing: 0.04em;
  font-weight: 500;
}

.toolbar-route {
  max-width: 14rem;
}

.v-avatar img {
  padding: 0.125rem;
}

:deep(.v-toolbar__append) {
  gap: 0.25rem;
  // Let Renoir's glow/particles spill out of the bar.
  overflow: visible;
}

.app-renoir :deep(.panel-launcher) {
  width: 2.75rem;
  height: 2.75rem;
}

:deep(.v-list-item){
  padding-inline: 0.5rem;
}
</style>
