<template>
  <VNavigationDrawer
    width="74"
    class="navigation-rail"
    color="transparent"
    elevation="0"
    location="left"
    border="none"
    permanent
  >
    <VTabs
      class="rail-tabs"
      direction="vertical"
      height="60"
      hide-slider
      stacked
    >
      <VTab
        v-for="tab in railTabs"
        :key="tab.key"
        :active="tab.isActive"
        :ripple="false"
        :text="tab.label"
        :to="tab.to"
        class="rail-tab mb-1"
      >
        <template #prepend>
          <VBadge
            :color="tab.badgeColor ?? 'secondary'"
            :content="tab.badge"
            :model-value="!!tab.badge"
            offset-x="-2"
            offset-y="-2"
          >
            <span :class="{ 'is-active': tab.isActive }" class="rail-icon">
              <VIcon :icon="`mdi-${tab.icon}`" class="rail-icon-outline" />
              <VIcon :icon="`mdi-${tab.activeIcon}`" class="rail-icon-fill" />
            </span>
          </VBadge>
        </template>
      </VTab>
    </VTabs>
    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import type { RouteLocationNamedRaw } from 'vue-router';

export interface RailTab {
  key: string;
  label: string;
  // Outlined at rest, filled when active
  icon: string;
  activeIcon: string;
  to: RouteLocationNamedRaw;
  matches?: (routeName: string) => boolean;
  badge?: string;
  badgeColor?: string;
}

const props = defineProps<{ tabs: RailTab[] }>();

const route = useRoute();

const isTabActive = ({ matches, to }: RailTab) => {
  const name = String(route.name ?? '');
  return matches ? matches(name) : to.name === name;
};

const railTabs = computed(() =>
  props.tabs.map((tab) => ({ ...tab, isActive: isTabActive(tab) })),
);
</script>

<style lang="scss" scoped>
.navigation-rail {
  text-align: center;
}

.rail-tabs {
  :deep(.v-slide-group__container) {
    gap: 0.125rem;
  }

  .rail-tab {
    min-width: unset;
    justify-content: center;
    padding: 0;
    font-size: 0.6875rem;
    letter-spacing: 0.02em;
    text-transform: none;
    border-radius: 10px;
    transition: color 0.3s ease;

    :deep(.v-btn__overlay) {
      opacity: 0 !important;
    }

    :deep(.v-btn__prepend) {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.125rem;
      height: 2.125rem;
      margin-inline: 0;
      border-radius: 8px;
      transition: background-color 0.3s ease, color 0.3s ease;

      .v-icon {
        padding: 1rem;
      }
    }

    &.v-btn--active {
      color: rgba(var(--v-theme-on-surface), 1);
    }

    &:hover :deep(.v-btn__prepend) {
      background: rgba(var(--v-theme-on-surface-container-highest), 0.2);
      color: rgba(var(--v-theme-on-surface), 1);

      .v-icon {
        transform: scale(1.1);
      }
    }

    &.v-tab--selected,
    &.v-btn--active {
      :deep(.v-btn__prepend) {
        background: rgba(var(--v-theme-surface-container-highest), 1);
        color: rgba(var(--v-theme-on-surface), 1);

        .v-icon {
          transform: scale(1.1);
        }
      }
    }
  }
}

// Outline and fill stacked; activating fades the fill in as it grows
.rail-icon {
  display: grid;

  .v-icon {
    grid-area: 1 / 1;
    transition:
      transform 0.3s ease,
      opacity 0.2s ease,
      scale 0.3s cubic-bezier(0.2, 0, 0, 1);
  }

  .rail-icon-fill {
    opacity: 0;
    scale: 0.6;
  }

  &.is-active {
    .rail-icon-outline {
      opacity: 0;
    }

    .rail-icon-fill {
      opacity: 1;
      scale: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .v-icon {
      transition: none;
    }
  }
}
</style>
