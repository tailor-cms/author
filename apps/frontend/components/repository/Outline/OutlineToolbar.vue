<template>
  <VToolbar class="toolbar" color="transparent">
    <VSpacer />
    <VHover>
      <template #default="{ isHovering, props: hoverProps }">
        <VTextField
          v-bind="hoverProps"
          v-model="search"
          :bg-color="isHovering ? 'primary-darken-1' : 'primary-darken-2'"
          :class="{ 'mr-4': !isFlat }"
          density="comfortable"
          placeholder="Search by name or id..."
          prepend-inner-icon="mdi-magnify"
          rounded="xl"
          variant="outlined"
          clearable
          hide-details
          @click:clear="search = ''"
        />
      </template>
    </VHover>
    <VHover
      v-if="repositoryStore.schemaOutlineStyle === OutlineStyle.Flat"
      v-slot="{ isHovering, props: hoverProps }"
    >
      <VSelect
        v-bind="hoverProps"
        v-model="activityTypes"
        :bg-color="isHovering ? 'primary-darken-1' : 'primary-darken-2'"
        :items="activityTypeOptions"
        class="mr-4"
        density="comfortable"
        item-title="label"
        item-value="type"
        max-width="232"
        placeholder="Filter by type"
        rounded="xl"
        variant="solo"
        clearable
        flat
        hide-details
        multiple
      />
    </VHover>
    <VBtn
      v-else-if="!isFlat"
      :disabled="!!search"
      class="px-5"
      color="primary-lighten-4"
      height="42"
      variant="tonal"
      @click="repositoryStore.toggleOutlineExpand"
    >
      Toggle all
    </VBtn>
  </VToolbar>
</template>

<script lang="ts" setup>
import {
  type ActivityConfig,
  OutlineStyle,
} from '@tailor-cms/interfaces/schema';

import { useCurrentRepository } from '@/stores/current-repository';

interface Props {
  activityTypeOptions: ActivityConfig[];
  isFlat?: boolean;
}

withDefaults(defineProps<Props>(), {
  isFlat: false,
});

const search = defineModel<string | null>('search', { default: null });
const activityTypes = defineModel<string[]>('activityTypes', {
  default: () => [],
});

defineEmits(['search']);

const repositoryStore = useCurrentRepository();
</script>

<style lang="scss" scoped>
.toolbar {
  z-index: 1;
}

.v-text-field {
  max-width: 24rem;
  transition: all 1s;

  :deep(.v-field__outline) {
    display: none;
  }
}

:deep(input::placeholder) {
  opacity: 0.75;
}
</style>
