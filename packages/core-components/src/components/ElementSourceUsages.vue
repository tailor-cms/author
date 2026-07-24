<template>
  <VMenu
    v-model="menuOpen"
    :close-on-content-click="false"
    class="element-source-usages"
    location="left"
    max-height="400"
    offset="4"
  >
    <template #activator="{ props: menuProps }">
      <VBadge :color="badgeColor" :content="usages?.length ?? '?'">
        <VBtn
          v-tooltip:left="{
            text: 'Linked copies',
            disabled: menuOpen,
            openDelay: 1000,
          }"
          v-bind="menuProps"
          aria-label="Source usages"
          color="secondary"
          icon="mdi-source-fork"
          size="x-small"
          variant="tonal"
        />
      </VBadge>
    </template>
    <VSheet :theme="$vuetify.theme.global.name" min-width="280" rounded="lg">
      <div class="px-4 pt-3 pb-2 text-label-medium">
        Linked Copies
      </div>
      <VDivider />
      <div v-if="isLoading" class="d-flex justify-center py-4">
        <VProgressCircular color="primary" size="24" indeterminate />
      </div>
      <template v-else-if="usages?.length">
        <VList density="compact" nav>
          <VListItem
            v-for="usage in usages"
            :key="usage.uid"
            :subtitle="usage.outlineActivityName"
            :title="usage.repositoryName"
            prepend-icon="mdi-open-in-new"
            link
            @click="onViewUsage(usage)"
          />
        </VList>
      </template>
      <div v-else class="px-4 py-3 text-label-medium text-medium-emphasis">
        No linked copies found
      </div>
    </VSheet>
  </VMenu>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type {
  ContentElement,
  ElementSourceInfo,
} from '@tailor-cms/interfaces/content-element';

interface Props {
  element: ContentElement;
  usages?: ElementSourceInfo[] | null;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  usages: null,
  isLoading: false,
});

const emit = defineEmits<{
  'usages:fetch': [];
  'usage:view': [usage: ElementSourceInfo];
}>();

const menuOpen = ref(false);

const badgeColor = computed(() =>
  props.usages?.length ? 'secondary' : 'inverse-surface',
);

const onViewUsage = (usage: ElementSourceInfo) => {
  emit('usage:view', usage);
  menuOpen.value = false;
};

watch(menuOpen, (open) => {
  if (open && !props.usages && !props.isLoading) {
    emit('usages:fetch');
  }
});
</script>

<style lang="scss" scoped>
// Compact count badge
:deep(.v-badge__badge) {
  height: 1rem;
  min-width: 1rem;
  padding: 0 0.1875rem;
  font-size: 0.625rem;
  transform: translate(0.5625rem, 0.125rem);
}
</style>
